package com.synthai.youniverse;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.view.Gravity;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
  private final Handler handler = new Handler(Looper.getMainLooper());
  private WebView web;
  private TextView status;
  private boolean loaded;
  private int polls;
  private static final String COMPUTER = "http://127.0.0.1:5000";

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(Color.rgb(14,12,28));
    status = new TextView(this);
    status.setText("Starting the Linux Computer on this phone…");
    status.setTextColor(Color.WHITE);
    status.setTextSize(16);
    status.setGravity(Gravity.CENTER);
    root.addView(status, new FrameLayout.LayoutParams(-1,-1));
    web = new WebView(this);
    web.setVisibility(WebView.GONE);
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri=request.getUrl();
        if ("127.0.0.1".equals(uri.getHost()) && uri.getPort()==5000) return false;
        if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
          try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(Exception ignored) {}
        }
        return true;
      }
      @Override public void onPageFinished(WebView view, String url) {
        web.setVisibility(WebView.VISIBLE);
        status.setVisibility(TextView.GONE);
      }
    });
    root.addView(web, new FrameLayout.LayoutParams(-1,-1));
    setContentView(root);
    Intent intent=new Intent(this,ComputerBackendService.class);
    if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent);
    else startService(intent);
    handler.post(this::checkBackend);
  }
  private void checkBackend() {
    if (isFinishing() || loaded) return;
    String failure=ComputerBackendService.failure();
    if (failure != null) {
      status.setText("Linux Computer failed to start:\n\n"+failure);
      return;
    }
    if (ComputerBackendService.isReady()) {
      loaded=true;
      new Thread(() -> {
        // A private local login for the original trained Cynthia model.
        try {
          HttpURLConnection c=(HttpURLConnection)new URL(COMPUTER+"/api/cynthia-resident/login").openConnection();
          c.setRequestMethod("POST");
          c.setConnectTimeout(5000);
          c.setReadTimeout(5000);
          c.setDoOutput(true);
          c.setRequestProperty("Content-Type","application/json");
          String token=ComputerBackendService.sessionSecret(this);
          String body=new org.json.JSONObject().put("token",token).toString();
          try(OutputStream out=c.getOutputStream()){out.write(body.getBytes(StandardCharsets.UTF_8));}
          String cookie=c.getHeaderField("Set-Cookie");
          if (c.getResponseCode()==200 && cookie!=null) {
            CookieManager.getInstance().setAcceptCookie(true);
            CookieManager.getInstance().setCookie(COMPUTER,cookie);
            CookieManager.getInstance().flush();
          }
          c.disconnect();
        } catch(Exception ignored) {
          // Computer remains accessible and the user can sign in manually.
        }
        handler.post(() -> web.loadUrl(COMPUTER+"/computer"));
      },"Cynthia-original-local-login").start();
      return;
    }
    polls++;
    if (polls%10==0) status.setText("Starting Linux Computer…\nInstalling and checking local services.\nAttempt "+polls);
    handler.postDelayed(this::checkBackend,1000);
  }
  @Override public void onBackPressed() {
    if(web != null && web.canGoBack()) web.goBack();
    else super.onBackPressed();
  }
  @Override public void onDestroy() {
    handler.removeCallbacksAndMessages(null);
    if(web != null) {web.destroy();web=null;}
    super.onDestroy();
  }
}
