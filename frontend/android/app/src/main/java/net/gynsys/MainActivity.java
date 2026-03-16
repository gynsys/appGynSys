package net.gynsys;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessaging;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(PushNotificationsPlugin.class);

        try {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            String defaultUA = settings.getUserAgentString();
            if (!defaultUA.contains("GynSysApp")) {
                settings.setUserAgentString(defaultUA + " GynSysApp/Capacitor/3.0.1");
            }
        } catch (Exception e) {
            Log.e("GynSysDebug", "Failed to set custom User Agent", e);
        }

        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    Log.d("GynSysDebug", "TOKEN FCM: " + task.getResult());
                }
            });
    }
}
