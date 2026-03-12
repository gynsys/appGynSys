package net.gynsys;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
