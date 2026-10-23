package org.youniverse.cynthiahover;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.*;
import android.widget.TextView;

public final class PlanetService extends Service {
  static final String CHANNEL = "cynthia_presence";
  private WindowManager manager;
  private View planet;
  static void channel(Context ctx) {
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch = new NotificationChannel(CHANNEL, "Cynthia floating planet", NotificationManager.IMPORTANCE_LOW);
      ((NotificationManager)ctx.getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
    }
  }
  @Override public void onCreate() {
    super.onCreate();
    channel(this);
    Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent action = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    Notification notification = new Notification.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("Cynthia is nearby").setContentText("Tap the planet to open her workspace").setContentIntent(action)
      .setOngoing(true).build();
    startForeground(1001, notification);
    if (!Settings.canDrawOverlays(this)) { stopSelf(); return; }
    manager = (WindowManager)getSystemService(WINDOW_SERVICE);
    TextView v = new TextView(this);
    v.setText("✦");
    v.setTextSize(30);
    v.setTextColor(Color.WHITE);
    v.setGravity(Gravity.CENTER);
    GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
        new int[]{0xff6730c2,0xff11a8a0});
    bg.setCornerRadius(99);
    bg.setStroke(2,0xffa6f7e8);
    v.setBackground(bg);
    v.setElevation(12);
    final WindowManager.LayoutParams p = new WindowManager.LayoutParams(64,64,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT);
    p.gravity=Gravity.TOP | Gravity.START;
    p.x=getResources().getDisplayMetrics().widthPixels-90;
    p.y=getResources().getDisplayMetrics().heightPixels/3;
    v.setOnTouchListener(new View.OnTouchListener() {
      float startX,startY; int originX,originY; boolean dragging;
      @Override public boolean onTouch(View w, android.view.MotionEvent e) {
        switch(e.getActionMasked()){
          case android.view.MotionEvent.ACTION_DOWN:
            startX=e.getRawX();startY=e.getRawY();originX=p.x;originY=p.y;dragging=false;return true;
          case android.view.MotionEvent.ACTION_MOVE:
            int dx=(int)(e.getRawX()-startX),dy=(int)(e.getRawY()-startY);
            if(Math.abs(dx)>8||Math.abs(dy)>8) dragging=true;
            p.x=originX+dx;p.y=originY+dy;
            manager.updateViewLayout(v,p);return true;
          case android.view.MotionEvent.ACTION_UP:
            if(!dragging)startActivity(new Intent(PlanetService.this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP));
            return true;
        }
        return false;
      }
    });
    planet=v;
    manager.addView(planet,p);
  }
  @Override public int onStartCommand(Intent i,int flags,int id){return START_STICKY;}
  @Override public void onDestroy(){if(manager!=null&&planet!=null){manager.removeView(planet);planet=null;}super.onDestroy();}
  @Override public IBinder onBind(Intent intent){return null;}
}
