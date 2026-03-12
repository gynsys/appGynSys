package net.gynsys;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessaging;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Explicitly register the plugin for remote URL loads
        registerPlugin(PushNotificationsPlugin.class);

        // Custom User Agent for reliable native detection (isCapacitor)
        // This is critical for remote URL loading (gynsys.net)
        try {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            String defaultUA = settings.getUserAgentString();
            if (!defaultUA.contains("GynSysApp")) {
                settings.setUserAgentString(defaultUA + " GynSysApp/Capacitor/3.0.1");
                Log.d("GynSysDebug", "Custom User Agent with version applied");
            }
        } catch (Exception e) {
            Log.e("GynSysDebug", "Failed to set custom User Agent", e);
        }

        // Diagnóstico: Obtener el token de Firebase directamente para verificar la conexión
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w("GynSysDebug", "Error al obtener el token de FCM", task.getException());
                    return;
                }

                // Obtener el nuevo token de registro de FCM
                String token = task.getResult();
                Log.d("GynSysDebug", "TOKEN DE REGISTRO (FCM): " + token);
            });
    }
}
