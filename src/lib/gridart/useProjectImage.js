import { useEffect, useState } from "react";
import { loadImageFromUri } from "./image";

export function useProjectImage(uri) {
  const [state, setState] = useState({ image: null, objectUrl: null, loading: Boolean(uri), error: null });

  useEffect(() => {
    if (!uri) {
      setState({ image: null, objectUrl: null, loading: false, error: null });
      return undefined;
    }
    let alive = true;
    let loadedUrl = null;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    loadImageFromUri(uri)
      .then(({ image, objectUrl }) => {
        loadedUrl = objectUrl;
        if (!alive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setState({ image, objectUrl, loading: false, error: null });
      })
      .catch((error) => {
        if (alive) setState({ image: null, objectUrl: null, loading: false, error: error.message });
      });
    return () => {
      alive = false;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [uri]);

  return state;
}