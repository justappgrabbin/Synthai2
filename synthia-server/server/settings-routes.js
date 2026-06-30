function attachSettingsRoutes(app) {
  app.get('/api/settings/runtime', (_req, res) => {
    res.json({
      ok: true,
      mcp: {
        status: '/mcp/status',
        bootstrap: '/mcp/bootstrap',
        bus: '/mcp/bus',
        agents: '/mcp/agents',
        route: '/mcp/route',
        inbox: '/mcp/inbox/:agent',
        trident_status: '/trident/mcp/status',
        trident_tools: '/trident/mcp/tools',
      },
      huggingface: {
        namespace: process.env.HUGGINGFACE_NAMESPACE || process.env.HF_NAMESPACE || 'stellarproximology',
        trident_repo: process.env.TRIDENT_HF_REPO || process.env.HF_REPO_ID || 'stellarproximology/Trident',
        trident_model_url: process.env.TRIDENT_MODEL_URL || process.env.HF_MODEL_URL || '',
        token_configured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN),
        models_base_url: 'https://huggingface.co/stellarproximology',
      },
      storage: {
        local_app_data_dir: process.env.APP_DATA_DIR || 'data/apps',
        supabase_bucket: process.env.SUPABASE_APP_BUCKET || 'synthia-apps',
        supabase_configured: Boolean(
          (process.env.SUPABASE_PRIMARY_URL || process.env.SUPABASE_URL) &&
          (process.env.SUPABASE_PRIMARY_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)
        ),
      },
      self_editing: {
        available: true,
        recommended_flow: ['request', 'generate_patch', 'preview_diff', 'approve', 'apply', 'test'],
      },
    });
  });
}

module.exports = attachSettingsRoutes;
