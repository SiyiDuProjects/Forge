---
received_date: 2026-06-06
source_context: Browser comment on the right inspector 3D result surface at http://127.0.0.1:8782
related_task: Remove unnecessary default text below 3D model status
status: implemented
key_handles: right inspector, 3D 模型状态, proxy-notice, ComponentDescriptor, component asset source, generated evidence, 生成证据
---

# Raw Comment

User selected the right inspector paragraph:

> 这个原型使用机械代理组件：尺寸、孔位、接口和避让体积来自 ComponentDescriptor，仍需人工工程验证，不能视为生产就绪。

User feedback:

> 下面那些所有字都是没必要的吧，3D模型以下的所有字，看起来都是废话

# Durable Decision

- The default right inspector should stop at the compact 3D preview, layer controls, shell path, dimensions, structure checks, and `3D 模型状态`.
- Do not render the proxy ComponentDescriptor disclaimer, component asset source list, generated evidence link list, or instruction paragraphs below the 3D model status row by default.
- ComponentDescriptor, component asset manifest, validation report, GLB/STL/STEP, and design summary files remain generated and persisted as revision evidence. They should be reachable through backend/workspace artifacts or explicit engineering/review surfaces, not stacked in the default visual inspector.
- Keep the fullscreen 3D affordance and layer switching available. Do not turn this simplification into CAD editing, export, checkout, or production controls.
