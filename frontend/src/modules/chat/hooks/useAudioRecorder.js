import { useReactMediaRecorder } from "react-media-recorder";
import { useEffect, useState } from "react";

const useAudioRecorder = () => {
    const {
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
        clearBlobUrl
    } = useReactMediaRecorder({ audio: true });

    const [audioBlob, setAudioBlob] = useState(null);

    // Fetch the blob object when recording stops and URL is generated
    useEffect(() => {
        if (mediaBlobUrl) {
            fetch(mediaBlobUrl)
                .then(res => res.blob())
                .then(blob => setAudioBlob(blob));
        } else {
            setAudioBlob(null);
        }
    }, [mediaBlobUrl]);

    const reset = () => {
        clearBlobUrl();
        setAudioBlob(null);
    };

    return {
        isRecording: status === "recording",
        startRecording,
        stopRecording,
        mediaBlobUrl,
        audioBlob,
        reset
    };
};

export default useAudioRecorder;
