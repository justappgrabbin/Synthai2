package com.synthai.youniverse;

import android.content.Context;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class LinuxContainer {
  private static final String TAG="SynthAI2-Linux";
  private final Context context;
  private final String secret;
  private volatile Process process;
  private boolean verified=false;
  private final StringBuilder tail=new StringBuilder();
  LinuxContainer(Context context,String secret){this.context=context.getApplicationContext();this.secret=secret;}
  boolean isVerified(){return verified && process!=null && process.isAlive();}

  void startAndVerify() throws Exception {
    if(!Arrays.asList(Build.SUPPORTED_ABIS).contains("arm64-v8a"))
      throw new UnsupportedOperationException("Linux rootfs requires ARM64: "+Arrays.toString(Build.SUPPORTED_ABIS));
    RootfsInstaller.Result result=RootfsInstaller.installIfNeeded(context);
    Exception first=null;
    for(boolean noSeccomp:new boolean[]{false,true}) {
      try {
        launch(result,noSeccomp);
        verify();
        verified=true;
        Log.i(TAG,"EMBEDDED_LINUX_READY=true noSeccomp="+noSeccomp);
        return;
      }catch(Exception error) {
        first=error;
        Log.w(TAG,"Linux startup attempt failed",error);
        stop();
      }
    }
    throw new IllegalStateException("Linux services failed: "+(first==null?"unknown":first.getMessage())+"; process output: "+tail());
  }
  private void launch(RootfsInstaller.Result installed,boolean noSeccomp) throws Exception {
    File nativeDir=new File(context.getApplicationInfo().nativeLibraryDir);
    File proot=new File(nativeDir,"libproot.so"),loader=new File(nativeDir,"libproot-loader.so");
    File loader32=new File(nativeDir,"libproot-loader32.so");
    if(!proot.isFile() || !loader.isFile())throw new IOException("PRoot/loader missing from installed APK");
    File tmp=new File(context.getFilesDir(),"proot-tmp");
    if(!tmp.exists()&&!tmp.mkdirs())throw new IOException("Cannot create PRoot temporary directory");
    List<String> args=new ArrayList<>();
    Collections.addAll(args,proot.getAbsolutePath(),"-0","--link2symlink","-r",installed.rootfs.getAbsolutePath(),
      "-b","/dev","-b","/proc","-b","/sys",
      "-b",installed.data.getAbsolutePath()+":/var/lib/synthai",
      "-w","/opt/synthai","/usr/local/bin/node","/opt/synthai/guest/start.mjs");
    ProcessBuilder pb=new ProcessBuilder(args);
    pb.redirectErrorStream(true);
    Map<String,String> env=pb.environment();
    env.put("PROOT_TMP_DIR",tmp.getAbsolutePath());
    env.put("PROOT_LOADER",loader.getAbsolutePath());
    if(loader32.isFile())env.put("PROOT_LOADER_32",loader32.getAbsolutePath());
    env.put("LD_LIBRARY_PATH",nativeDir.getAbsolutePath());
    env.put("HOME","/root");
    env.put("PATH","/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
    env.put("TMPDIR","/tmp");
    env.put("SYNTHIA_PHONE_CONTAINER","1");
    env.put("NODE_ENV","production");
    env.put("PORT","5000");
    env.put("SYNTHIA_NODE_PORT","10000");
    env.put("SYNTHIA_PYTHON_PORT","8001");
    env.put("PYTHON_API_URL","http://127.0.0.1:8001");
    env.put("PYTHON_API_AUTOSTART","false");
    env.put("SYNTHIA_KLEIN_PORT","7860");
    env.put("SYNTHIA_KLEIN_OWNER_TOKEN",secret);
    env.put("TERMINAL_TOKEN",secret);
    env.put("SYNTHIA_BUILD_TOKEN",secret);
    env.put("LINUX_CONTAINER_ENABLED","true");
    env.put("LINUX_CONTAINER_WORKDIR","/var/lib/synthai/workspace");
    env.put("LINUX_CONTAINER_SHELL","/bin/bash");
    env.put("MESH_DATA_DIR","/var/lib/synthai");
    env.put("SYNTHAI_DATA_DIR","/var/lib/synthai");
    env.put("SYNTHIA_URL","http://127.0.0.1:8001");
    env.put("PYTHON_API_PORT","8001");
    env.put("CORS_ORIGIN","http://127.0.0.1:5000");
    if(noSeccomp)env.put("PROOT_NO_SECCOMP","1");
    process=pb.start();
    Process active=process;
    new Thread(()->{
      try(BufferedReader reader=new BufferedReader(new InputStreamReader(active.getInputStream(),StandardCharsets.UTF_8))) {
        String s;
        while((s=reader.readLine())!=null){
          synchronized(tail){tail.append(s).append('\n');if(tail.length()>10000)tail.delete(0,tail.length()-7000);}
          Log.i(TAG,s.length()>300?s.substring(0,300):s);
        }
      }catch(IOException ignored){}
    },"synthai-linux-logs").start();
  }
  private String tail(){synchronized(tail){return tail.toString();}}
  private void verify() throws Exception {
    long deadline=SystemClock.elapsedRealtime()+180000L;
    Exception last=null;
    while(SystemClock.elapsedRealtime()<deadline) {
      if(process==null || !process.isAlive())throw new IllegalStateException("Linux process exited: "+tail());
      try {
        String computer=request("http://127.0.0.1:5000/api/health");
        if(!new JSONObject(computer).optString("status").equals("ok"))
          throw new IOException("Computer Express backend not healthy");
        String model=request("http://127.0.0.1:5000/api/cynthia-resident/status");
        if(!new JSONObject(model).optBoolean("running",false))
          throw new IOException("Original trained Cynthia model has not loaded");
        String python=request("http://127.0.0.1:8001/health");
        if(python.isEmpty())throw new IOException("Synthia Python backend did not respond");
        String node=request("http://127.0.0.1:10000/health");
        if(node.isEmpty())throw new IOException("Synthia Node backend did not respond");
        return;
      }catch(Exception e){last=e;SystemClock.sleep(1000);}
    }
    throw new IllegalStateException("Required backend health checks failed: "+(last==null?"unknown":last.getMessage()));
  }
  private String request(String value)throws Exception {
    HttpURLConnection c=(HttpURLConnection)new URL(value).openConnection();
    c.setConnectTimeout(1500);c.setReadTimeout(2000);
    c.setRequestProperty("Accept","application/json");
    try(InputStream input=c.getInputStream()){
      ByteArrayOutputStream out=new ByteArrayOutputStream();
      byte[] buf=new byte[4096];int n;
      while((n=input.read(buf))!=-1){out.write(buf,0,n);if(out.size()>131072)break;}
      return out.toString("UTF-8");
    }finally{c.disconnect();}
  }
  void stop(){
    verified=false;
    Process p=process;process=null;
    if(p!=null){p.destroy();try{p.waitFor();}catch(InterruptedException e){Thread.currentThread().interrupt();}}
  }
}
