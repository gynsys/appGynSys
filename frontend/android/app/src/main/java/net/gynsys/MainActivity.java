package net.gynsys;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registramos el plugin manualmente para asegurar que el bridge lo vea
        registerPlugin(PushNotificationsPlugin.class);

        // Configuramos el WebView para que sea compatible con la web remota
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Forzamos la carga de la URL específica
        this.bridge.getWebView().loadUrl("https://gynsys.net/dr/mariel-herrera");
        
        // Mantener soporte para solicitudes de permisos desde la web
        this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }
}
