package net.gynsys;

import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "GynSysDebug";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "Iniciando MainActivity...");

        // Registramos el plugin manualmente
        try {
            registerPlugin(PushNotificationsPlugin.class);
            Log.d(TAG, "PushNotificationsPlugin registrado correctamente.");
        } catch (Exception e) {
            Log.e(TAG, "Error al registrar PushNotificationsPlugin: " + e.getMessage());
        }

        WebView webView = this.bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Diagnóstico: Inyectar un script al cargar la página para verificar el Bridge
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Página cargada: " + url);
                
                // Inyectamos un script de diagnóstico que se puede ver en Logcat
                view.evaluateJavascript(
                    "(function() {" +
                    "  var status = {" +
                    "    capacitorExists: typeof window.Capacitor !== 'undefined'," +
                    "    pluginsExists: typeof window.Capacitor !== 'undefined' && typeof window.Capacitor.Plugins !== 'undefined'," +
                    "    pushPluginExists: typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && typeof window.Capacitor.Plugins.PushNotifications !== 'undefined'," +
                    "    platform: typeof window.Capacitor !== 'undefined' ? window.Capacitor.getPlatform() : 'unknown'" +
                    "  };" +
                    "  console.log('DIAGNOSTICO_CAPACITOR: ' + JSON.stringify(status));" +
                    "  return status;" +
                    "})();", 
                    value -> Log.d(TAG, "Resultado Diagnóstico JS: " + value)
                );
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                Log.d(TAG, "Solicitud de permiso detectada: " + java.util.Arrays.toString(request.getResources()));
                request.grant(request.getResources());
            }
        });

        Log.d(TAG, "Cargando URL: https://gynsys.net/dr/mariel-herrera");
        webView.loadUrl("https://gynsys.net/dr/mariel-herrera");
    }
}
