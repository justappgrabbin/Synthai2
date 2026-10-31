"""Adapter to the user's preserved AdaptiveAgent; no changes to its core."""
from __future__ import annotations
import argparse
import asyncio
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import zipfile

MODULES = ("core.py", "state.py", "goals.py", "constraints.py", "actions.py", "feedback.py")

def load_original_agent():
    archive = Path(__file__).with_name("source.zip")
    if not archive.is_file():
        raise FileNotFoundError("Adaptive Agent source.zip is missing")
    module_dir = Path(tempfile.gettempdir()) / "synthia-adaptive-agent-preserved"
    module_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for name in MODULES:
            (module_dir / name).write_bytes(z.read("adaptive-agent-main/" + name))
    sys.path.insert(0, str(module_dir))
    from core import AdaptiveAgent, AgentConfig
    from state import StateObserver, WorldState
    from actions import ActionResult
    return AdaptiveAgent, AgentConfig, StateObserver, WorldState, ActionResult

def state_file(workspace):
    return workspace / ".synthia" / "adaptive-agent-state.json"

def read_state(workspace):
    try:
        return json.loads(state_file(workspace).read_text())
    except (OSError, ValueError):
        return {"step": 0, "phase": "idle", "events": [], "blocked": None}

def write_state(workspace, state):
    dest = state_file(workspace)
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.replace(dest)

def project_revision(root):
    try:
        r = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True, timeout=5)
        if r.returncode == 0:
            return r.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        pass
    return str((root / "package.json").stat().st_mtime_ns)

def perform_action(root, workspace, ActionResult):
    record = read_state(workspace)
    revision = project_revision(root)
    if record.get("revision") != revision:
        record = {"step": 0, "phase": "working", "events": [], "blocked": None, "revision": revision}
    step = int(record.get("step", 0))
    if step >= 3:
        return ActionResult(success=True, output="Build already verified at current revision")
    stage = ("inspect", "check", "build")[step]
    if stage == "inspect":
        try:
            scripts = json.loads((root / "package.json").read_text()).get("scripts", {})
            if not all(x in scripts for x in ("check", "build")):
                raise ValueError("Required check/build scripts missing")
            result = {"ok": True, "output": "Verified existing SynthAi2 build scripts"}
        except (ValueError, OSError) as exc:
            result = {"ok": False, "output": str(exc)}
    else:
        try:
            cmd = subprocess.run(
                ["npm", "run", stage], cwd=root, capture_output=True,
                text=True, timeout=180, check=False, env=os.environ.copy(),
            )
            result = {"ok": cmd.returncode == 0, "output": (cmd.stdout + "\n" + cmd.stderr)[-4500:]}
        except (OSError, subprocess.TimeoutExpired) as exc:
            result = {"ok": False, "output": str(exc)}
    record.setdefault("events", []).append({"at": int(time.time()), "stage": stage, **result})
    record["events"] = record["events"][-30:]
    record["blocked"] = None if result["ok"] else result["output"]
    if result["ok"]:
        record["step"] = step + 1
    record["phase"] = "verified" if record["step"] >= 3 else ("blocked" if record["blocked"] else "working")
    write_state(workspace, record)
    return ActionResult(success=result["ok"], output=result["output"] if result["ok"] else None,
                        error=None if result["ok"] else result["output"])

async def cycle(root, workspace, execute):
    Agent, Config, Observer, WorldState, ActionResult = load_original_agent()
    class ProjectObserver(Observer):
        def __init__(self):
            super().__init__("synthia_project_progress")
        async def observe(self):
            s = WorldState()
            record = read_state(workspace)
            step = 0 if record.get("revision") != project_revision(root) else record.get("step", 0)
            s.set("verified_stages", float(step))
            return s
    agent = Agent(Config(max_cycles=1, cycle_interval_seconds=0,
                         execution_mode="live" if execute else "dry_run",
                         permitted_actions=("advance_verified_build",) if execute else ()))
    agent.register_observer(ProjectObserver())
    agent.register_goal("verified_stages", target=3, direction="maximize")
    agent.register_action("advance_verified_build", lambda _: perform_action(root, workspace, ActionResult),
                          cost=0.1, expected_benefit=3, risk=0.1)
    await agent.run()
    return {"agent": agent.status_report(), "project": read_state(workspace),
            "execution": "live" if execute else "observe"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", required=True)
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    root = Path(args.project_root).resolve()
    workspace = Path(args.workspace).resolve()
    if not (root / "synthia-server" / "adaptive-agent" / "source.zip").is_file():
        parser.error("Invalid SynthAi2 project root")
    workspace.mkdir(parents=True, exist_ok=True)
    print(json.dumps(asyncio.run(cycle(root, workspace, args.execute))))

if __name__ == "__main__":
    main()
