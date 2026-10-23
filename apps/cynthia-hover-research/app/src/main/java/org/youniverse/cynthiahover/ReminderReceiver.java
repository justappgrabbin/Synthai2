package org.youniverse.cynthiahover;
import android.app.*;
import android.content.*;
import android.os.Build;
public final class ReminderReceiver extends BroadcastReceiver {
  static final String CHANNEL="cynthia_reminders";
  @Override public void onReceive(Context context, Intent intent){
    NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
    if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Cynthia reminders",NotificationManager.IMPORTANCE_DEFAULT));
    if(Build.VERSION.SDK_INT>=33&&context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
    String title=intent.getStringExtra("title");
    String id=intent.getStringExtra("id");
    Intent open=new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    PendingIntent tap=PendingIntent.getActivity(context,0,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
    Notification notice=new Notification.Builder(context,CHANNEL).setContentTitle("Cynthia · To-do reminder")
     .setContentText(title==null?"A task needs your attention":title).setSmallIcon(android.R.drawable.ic_dialog_info)
     .setAutoCancel(true).setContentIntent(tap).build();
    manager.notify(id==null?1:id.hashCode(),notice);
  }
}
