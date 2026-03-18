package net.gynsys;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registro del plugin de notificaciones (necesario para URLs remotas)
        registerPlugin(PushNotificationsPlugin.class);

        // Identificación de la App ante el servidor (User Agent)
        try {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            String defaultUA = settings.getUserAgentString();
            if (!defaultUA.contains("GynSysApp")) {
                settings.setUserAgentString(defaultUA + " GynSysApp/Capacitor/3.0.1");
            }
        } catch (Exception e) {
            Log.e("GynSysDebug", "Error configurando WebView", e);
        }

        // --- LÓGICA DEL SPINNER CLÁSICO (INYECCIÓN DIRECTA) ---
        // 1. Inflamos el diseño de la capa de carga
        final View loadingOverlay = getLayoutInflater().inflate(R.layout.activity_main, null);
        
        // 2. Lo agregamos encima de todo el contenido de la ventana
        addContentView(loadingOverlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 
                ViewGroup.LayoutParams.MATCH_PARENT));

        final Handler handler = new Handler();
        handler.post(new Runnable() {
            @Override
            public void run() {
                WebView webView = getBridge().getWebView();
                // Verificamos si la página terminó de cargar (progreso 100)
                if (webView != null && webView.getProgress() == 100) {
                    // Ocultamos con un desvanecimiento suave
                    loadingOverlay.animate().alpha(0f).setDuration(500).withEndAction(new Runnable() {
                        @Override
                        public void run() {
                            loadingOverlay.setVisibility(View.GONE);
                            // Lo eliminamos para liberar memoria
                            ((ViewGroup)loadingOverlay.getParent()).removeView(loadingOverlay);
                        }
                    });
                } else {
                    // Si aún no carga, volvemos a preguntar en 200ms
                    handler.postDelayed(this, 200);
                }
            }
        });
    }
}
