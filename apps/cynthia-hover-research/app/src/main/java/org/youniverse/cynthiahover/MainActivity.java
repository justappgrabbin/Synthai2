package org.youniverse.cynthiahover;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.provider.Settings;
import android.speech.*;
import android.webkit.*;
import android.net.Uri;
import java.io.*;
import java.net.*;
import org.json.*;

public final class MainActivity extends Activity {
  private WebView web;
  private SpeechRecognizer recognizer;
  private boolean armed=false, commandMode=false, visible=false;
  private int consecutiveErrors=0;
  private final Handler handler=new Handler(Looper.getMainLooper());

  @Override public void onCreate(Bundle state){
    super.onCreate(state);
    getWindow().setStatusBarColor(0xff140c24);
    getWindow().setNavigationBarColor(0xff140c24);
    web=new WebView(this);
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setDomStorageEnabled(true);
    web.getSettings().setAllowFileAccess(false);
    web.getSettings().setAllowContentAccess(false);
    web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    WebView.setWebContentsDebuggingEnabled(false);
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req){
        Uri uri=req.getUrl();
        if("file".equals(uri.getScheme()) && "android_asset".equals(uri.getHost()))return false;
        if("https".equals(uri.getScheme())){
          startActivity(new Intent(Intent.ACTION_VIEW,uri)); return true;
        }
        return true;
      }
    });
    web.addJavascriptInterface(new Bridge(),"Cynthia");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
    if(android.os.Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},100);
  }
  @Override public void onResume(){super.onResume();visible=true;}
  @Override public void onPause(){visible=false;stopVoice();super.onPause();}
  @Override public void onDestroy(){stopVoice();if(web!=null)web.destroy();super.onDestroy();}
  private void emit(String event, String payload){
    if(web==null)return;
    String js="window.CynthiaEvents&&window.CynthiaEvents("+JSONObject.quote(event)+","+JSONObject.quote(payload)+")";
    runOnUiThread(()->web.evaluateJavascript(js,null));
  }
  private void stopVoice(){
    armed=false; commandMode=false;handler.removeCallbacksAndMessages(null);
    if(recognizer!=null){recognizer.destroy();recognizer=null;}
  }
  private void listen(){
    if(!visible)return;
    if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){
      requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},101);return;
    }
    if(!SpeechRecognizer.isRecognitionAvailable(this)){emit("voice_error","Speech recognition service unavailable");return;}
    if(recognizer!=null){recognizer.destroy();recognizer=null;}
    recognizer=SpeechRecognizer.createSpeechRecognizer(this);
    recognizer.setRecognitionListener(new RecognitionListener(){
      public void onReadyForSpeech(Bundle b){emit("voice_state",commandMode?"command":"wake");}
      public void onBeginningOfSpeech(){} public void onRmsChanged(float r){}
      public void onBufferReceived(byte[] b){} public void onEndOfSpeech(){}
      public void onError(int code){
        if(!armed||!visible)return;
        consecutiveErrors++;
        if(consecutiveErrors>=6){stopVoice();emit("voice_error","Recognition stopped after repeated errors; tap Wake again");return;}
        handler.postDelayed(()->startCycle(),Math.min(2500,350*consecutiveErrors));
      }
      public void onResults(Bundle b){
        if(!armed||!visible)return;
        java.util.ArrayList<String> words=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        String phrase=(words!=null&&!words.isEmpty())?words.get(0):"";
        consecutiveErrors=0;
        if(commandMode){
          commandMode=false;
          if(!phrase.isBlank())emit("voice_command",phrase);
        }else{
          String lower=phrase.toLowerCase(java.util.Locale.ROOT);
          int pos=lower.indexOf("cynthia");
          if(pos<0)pos=lower.indexOf("synthia");
          if(pos>=0){
            String after=phrase.substring(Math.min(phrase.length(),pos+7)).trim();
            emit("voice_wake","Cynthia");
            if(!after.isEmpty())emit("voice_command",after);
            else commandMode=true;
          }
        }
        handler.postDelayed(()->startCycle(),450);
      }
      public void onPartialResults(Bundle b){}public void onEvent(int type,Bundle b){}
    });
    startCycle();
  }
  private void startCycle(){
    if(!armed||!visible||recognizer==null)return;
    try{
      Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
      intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
      intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,false);
      recognizer.startListening(intent);
    }catch(Exception e){stopVoice();emit("voice_error",e.getMessage());}
  }
  @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] grants){
    super.onRequestPermissionsResult(requestCode,permissions,grants);
    if(requestCode==101&&grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED){armed=true;listen();}
    else if(requestCode==101)emit("voice_error","Microphone permission denied");
  }
  private String server(){return getPreferences(MODE_PRIVATE).getString("server","");}
  private String token(){return getPreferences(MODE_PRIVATE).getString("token","");}
  private void request(String route,JSONObject data){
    final String base=server(), bearer=token();
    if(!base.startsWith("https://")){emit("response",new JSONObjectSafe(false,"Set an HTTPS Cynthia research server in Settings").toString());return;}
    new Thread(()->{
      HttpURLConnection c=null;
      try{
        URL endpoint=new URL(base+route);
        c=(HttpURLConnection)endpoint.openConnection();
        c.setInstanceFollowRedirects(false);
        c.setConnectTimeout(15000);c.setReadTimeout(45000);
        c.setRequestMethod("POST");c.setDoOutput(true);
        c.setRequestProperty("Content-Type","application/json");
        c.setRequestProperty("Authorization","Bearer "+bearer);
        try(OutputStream stream=c.getOutputStream()){stream.write(data.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        int code=c.getResponseCode();
        InputStream input=code>=200&&code<300?c.getInputStream():c.getErrorStream();
        String value;
        try(InputStream is=input){value=new String(is.readNBytes(1024*1024),java.nio.charset.StandardCharsets.UTF_8);}
        emit("response",new JSONObject().put("ok",code>=200&&code<300).put("route",route).put("http",code).put("body",new JSONObject(value)).toString());
      }catch(Exception e){emit("response",new JSONObjectSafe(false,"Network error: "+e.getClass().getSimpleName()+" "+e.getMessage()).toString());}
      finally{if(c!=null)c.disconnect();}
    }).start();
  }
  private static final class JSONObjectSafe{
    private final JSONObject obj=new JSONObject();
    JSONObjectSafe(boolean ok,String message){try{obj.put("ok",ok);obj.put("error",message);}catch(Exception ignored){}}
    @Override public String toString(){return obj.toString();}
  }
  public class Bridge{
    @JavascriptInterface public void showPlanet(){runOnUiThread(()->{
      if(!Settings.canDrawOverlays(MainActivity.this)){
        startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,Uri.parse("package:"+getPackageName())));return;}
      Intent i=new Intent(MainActivity.this,PlanetService.class);
      if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);
    });}
    @JavascriptInterface public void hidePlanet(){runOnUiThread(()->stopService(new Intent(MainActivity.this,PlanetService.class)));}
    @JavascriptInterface public void armVoice(){runOnUiThread(()->{armed=true;consecutiveErrors=0;listen();});}
    @JavascriptInterface public void disarmVoice(){runOnUiThread(()->{stopVoice();emit("voice_state","off");});}
    @JavascriptInterface public void saveServer(String base,String apiToken){
      if(!base.matches("https://[A-Za-z0-9._:-]+/?")){emit("settings_error","HTTPS server URL required");return;}
      getPreferences(MODE_PRIVATE).edit().putString("server",base.replaceAll("/+$","")).putString("token",apiToken).apply();
      emit("settings_saved","saved");
    }
    @JavascriptInterface public String getServer(){return server();}
    @JavascriptInterface public void call(String route,String payload){
      if(!route.equals("/api/chat")&&!route.equals("/api/research")&&!route.equals("/api/model/observe")&&!route.equals("/api/model/status"))return;
      try{request(route,new JSONObject(payload));}catch(JSONException e){emit("response",new JSONObjectSafe(false,"Invalid JSON").toString());}
    }
    @JavascriptInterface public void remind(String id,String title,long at){
      if(at<=System.currentTimeMillis())return;
      AlarmManager alarms=(AlarmManager)getSystemService(ALARM_SERVICE);
      Intent intent=new Intent(MainActivity.this,ReminderReceiver.class).putExtra("title",title).putExtra("id",id);
      PendingIntent pending=PendingIntent.getBroadcast(MainActivity.this,id.hashCode(),intent,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
      alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending);
    }
    @JavascriptInterface public void openDriveLink(String url){
      if(!url.startsWith("https://drive.google.com/")&&!url.startsWith("https://docs.google.com/"))return;
      runOnUiThread(()->startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url))));
    }
  }
}
