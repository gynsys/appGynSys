package net.gynsys;

import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.ProgressBar;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "GynSysDebug";
    private static final String PREFS_NAME = "GynSysTheme";
    private static final String PREF_BG_COLOR = "splash_bg_color";
    private static final String PREF_ACCENT_COLOR = "splash_accent_color";
    private static final long MIN_SPLASH_MS = 1200L;

    /**
     * Bridge expuesto a JavaScript bajo window.GynSysAndroid.
     * Permite que la WebApp comunique el tema del tenant al nativo
     * para persistirlo y usarlo en el próximo arranque.
     */
    private class GynSysAndroidBridge {
        private final SharedPreferences prefs;

        GynSysAndroidBridge(SharedPreferences prefs) {
            this.prefs = prefs;
        }

        /**
         * Llamado desde JS: window.GynSysAndroid.setTheme(bgColor, accentColor, isDark)
         * Ejemplo claro:  setTheme("#FFFFFF", "#6366F1", false)
         * Ejemplo oscuro: setTheme("#000000", "#818CF8", true)
         *
         * @param bgColor      Color hex de fondo (e.g. "#FFFFFF")
         * @param accentColor  Color hex de acento (e.g. "#6366F1")
         * @param isDark       true = tema oscuro, false = tema claro
         */
        @JavascriptInterface
        public void setTheme(String bgColor, String accentColor, boolean isDark) {
            try {
                // Validar que sean colores hex válidos antes de guardar
                Color.parseColor(bgColor);
                Color.parseColor(accentColor);
                prefs.edit()
                        .putString(PREF_BG_COLOR, bgColor)
                        .putString(PREF_ACCENT_COLOR, accentColor)
                        .apply();
                Log.d(TAG, "Tema guardado — bg: " + bgColor + " accent: " + accentColor + " dark: " + isDark);
            } catch (IllegalArgumentException e) {
                Log.e(TAG, "setTheme: color hex inválido bg=" + bgColor + " accent=" + accentColor, e);
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(PushNotificationsPlugin.class);


        // --- Leer tema persistido del tenant ---
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedBg = prefs.getString(PREF_BG_COLOR, "#000000");
        String savedAccent = prefs.getString(PREF_ACCENT_COLOR, "#6366F1");

        // --- Inflar overlay de carga ---
        final View loadingOverlay = getLayoutInflater().inflate(net.gynsys.R.layout.activity_main, null);

        // Aplicar colores del tenant al overlay antes de mostrarlo
        try {
            loadingOverlay.setBackgroundColor(Color.parseColor(savedBg));
            ProgressBar progressBar = loadingOverlay.findViewById(net.gynsys.R.id.splash_progress);
            if (progressBar != null) {
                progressBar.setIndeterminateTintList(
                        android.content.res.ColorStateList.valueOf(Color.parseColor(savedAccent))
                );
            }
        } catch (IllegalArgumentException e) {
            Log.e(TAG, "Color inválido en SharedPreferences, usando defaults", e);
        }

        addContentView(loadingOverlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        // Iniciar animación suave de fade-in para evitar el "brinco" de los elementos
        ProgressBar progressBar = loadingOverlay.findViewById(net.gynsys.R.id.splash_progress);
        android.widget.TextView splashText = loadingOverlay.findViewById(net.gynsys.R.id.splash_text);
        if (progressBar != null) {
            progressBar.animate().alpha(1f).setDuration(600).setStartDelay(100).start();
        }
        if (splashText != null) {
            splashText.animate().alpha(1f).setDuration(600).setStartDelay(100).start();
        }

        // --- Configurar WebView ---
        try {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            // User-Agent para identificación en el servidor
            String defaultUA = settings.getUserAgentString();
            if (!defaultUA.contains("GynSysApp")) {
                settings.setUserAgentString(defaultUA + " GynSysApp/Capacitor/3.0.1");
            }

            // Registrar el bridge JS→Nativo
            webView.addJavascriptInterface(new GynSysAndroidBridge(prefs), "GynSysAndroid");

        } catch (Exception e) {
            Log.e(TAG, "Error configurando WebView", e);
        }

        // --- Esperar a que la WebView cargue (con tiempo mínimo de 1200ms) ---
        final long startTime = System.currentTimeMillis();
        final Handler handler = new Handler();

        handler.post(new Runnable() {
            @Override
            public void run() {
                WebView webView = getBridge().getWebView();
                long elapsed = System.currentTimeMillis() - startTime;
                boolean webLoaded = webView != null && webView.getProgress() == 100;
                boolean minTimeElapsed = elapsed >= MIN_SPLASH_MS;

                if (webLoaded && minTimeElapsed) {
                    // Fade-out suave de 600ms
                    loadingOverlay.animate()
                            .alpha(0f)
                            .setDuration(600)
                            .withEndAction(new Runnable() {
                                @Override
                                public void run() {
                                    loadingOverlay.setVisibility(View.GONE);
                                    if (loadingOverlay.getParent() != null) {
                                        ((ViewGroup) loadingOverlay.getParent()).removeView(loadingOverlay);
                                    }
                                }
                            });
                } else {
                    // Volver a verificar en 200ms
                    handler.postDelayed(this, 200);
                }
            }
        });
    }
}
