import SwiftUI
import WebKit

struct ForgeWebPreview: NSViewRepresentable {
    let modelURL: URL
    let serverURL: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsAirPlayForMediaPlayback = false
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsMagnification = true
        webView.navigationDelegate = context.coordinator
        if #available(macOS 13.3, *) {
            webView.isInspectable = true
        }
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        let key = "\(modelURL.absoluteString)|\(serverURL.absoluteString)"
        guard context.coordinator.loadedKey != key else { return }
        context.coordinator.loadedKey = key
        webView.loadHTMLString(previewHTML, baseURL: serverURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var loadedKey = ""
    }

    private var previewHTML: String {
        let modelURLLiteral = javascriptStringLiteral(modelURL.absoluteString)
        let serverRoot = serverURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let threeModuleURLLiteral = javascriptStringLiteral("\(serverRoot)/vendor/three/three.module.js")
        let threeAddonsURLLiteral = javascriptStringLiteral("\(serverRoot)/vendor/three/addons/")
        return """
        <!doctype html>
        <html lang="zh-Hans">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            html, body, #forge-preview {
              width: 100%;
              height: 100%;
              margin: 0;
              overflow: hidden;
              background: #f6f6f2;
              color: #24251f;
              font: 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
              letter-spacing: 0;
            }
            #forge-preview { position: relative; }
            canvas { width: 100%; height: 100%; display: block; cursor: grab; }
            canvas:active { cursor: grabbing; }
            #status {
              position: absolute;
              left: 10px;
              top: 10px;
              padding: 4px 8px;
              border: 1px solid rgba(36, 37, 31, .12);
              border-radius: 999px;
              background: rgba(255, 255, 255, .76);
              backdrop-filter: blur(12px);
              color: rgba(36, 37, 31, .74);
              pointer-events: none;
            }
          </style>
          <script type="importmap">
            {
              "imports": {
                "three": __THREE_MODULE_URL__,
                "three/addons/": __THREE_ADDONS_URL__
              }
            }
          </script>
        </head>
        <body>
          <div id="forge-preview">
            <canvas id="canvas" aria-label="原型结构预览（3D）"></canvas>
            <div id="status">正在加载 3D 模型</div>
          </div>
          <script type="module">
            import * as THREE from "three";
            import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
            import { OrbitControls } from "three/addons/controls/OrbitControls.js";

            const modelURL = __MODEL_URL__;
            const canvas = document.querySelector("#canvas");
            const status = document.querySelector("#status");
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setClearColor(0xf6f6f2, 1);
            renderer.outputColorSpace = THREE.SRGBColorSpace;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
            const controls = new OrbitControls(camera, canvas);
            controls.enableDamping = true;
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.screenSpacePanning = true;

            scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c0, 2.2));
            const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
            keyLight.position.set(2.2, 2.8, 3.2);
            scene.add(keyLight);
            const fillLight = new THREE.DirectionalLight(0xcfe5ff, 0.9);
            fillLight.position.set(-2.4, 1.2, -2.2);
            scene.add(fillLight);

            function resize() {
              const rect = canvas.getBoundingClientRect();
              const width = Math.max(260, rect.width || 280);
              const height = Math.max(150, rect.height || 180);
              renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
              renderer.setSize(width, height, false);
              camera.aspect = width / height;
              camera.updateProjectionMatrix();
            }

            function normalizeMaterial(material) {
              if (!material) return material;
              const normalized = material.clone();
              if (normalized.opacity < 1 || normalized.transparent) {
                normalized.transparent = true;
                normalized.depthWrite = false;
              }
              normalized.needsUpdate = true;
              return normalized;
            }

            function frame(root) {
              const box = new THREE.Box3().setFromObject(root);
              const center = new THREE.Vector3();
              const size = new THREE.Vector3();
              box.getCenter(center);
              box.getSize(size);
              const radius = Math.max(size.x, size.y, size.z, 1);
              controls.target.copy(center);
              camera.position.set(center.x + radius * 0.34, center.y + radius * 0.16, center.z + radius * 2.18);
              controls.update();
            }

            function animate() {
              resize();
              controls.update();
              renderer.render(scene, camera);
              window.requestAnimationFrame(animate);
            }

            new GLTFLoader().load(
              modelURL,
              (gltf) => {
                const root = gltf.scene;
                root.name = "forge_generated_3d_preview";
                root.traverse((node) => {
                  if (!node.isMesh) return;
                  node.castShadow = false;
                  node.receiveShadow = false;
                  node.material = Array.isArray(node.material)
                    ? node.material.map(normalizeMaterial)
                    : normalizeMaterial(node.material);
                });
                scene.add(root);
                frame(root);
                status.textContent = "真实 3D 预览已加载";
                animate();
              },
              undefined,
              () => {
                status.textContent = "3D 模型加载失败";
                resize();
                renderer.render(scene, camera);
              }
            );
          </script>
        </body>
        </html>
        """
        .replacingOccurrences(of: "__MODEL_URL__", with: modelURLLiteral)
        .replacingOccurrences(of: "__THREE_MODULE_URL__", with: threeModuleURLLiteral)
        .replacingOccurrences(of: "__THREE_ADDONS_URL__", with: threeAddonsURLLiteral)
    }

    private func javascriptStringLiteral(_ value: String) -> String {
        guard let data = try? JSONEncoder().encode(value),
              let literal = String(data: data, encoding: .utf8) else {
            return "\"\""
        }
        return literal
    }
}
