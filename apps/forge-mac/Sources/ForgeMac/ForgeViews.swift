import SwiftUI

struct ForgeRootView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        NavigationSplitView {
            ForgeSidebarView()
                .navigationSplitViewColumnWidth(min: 220, ideal: 260, max: 320)
        } content: {
            ForgeThreadView()
                .navigationSplitViewColumnWidth(min: 420, ideal: 620)
        } detail: {
            ForgeInspectorView()
                .navigationSplitViewColumnWidth(min: 320, ideal: 380, max: 460)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    Task { await state.reconnect() }
                } label: {
                    Label("刷新", systemImage: "arrow.clockwise")
                }
                .disabled(state.isLoading)

                Picker("运行模式", selection: $state.runtimeProvider) {
                    ForEach(ForgeRuntimeProvider.allCases) { provider in
                        Text(provider.title).tag(provider)
                    }
                }
                .labelsHidden()
                .frame(width: 170)

                Button {
                    state.showingSettings = true
                } label: {
                    Label("Forge 设置", systemImage: "gearshape")
                }
            }
        }
        .sheet(isPresented: $state.showingSettings) {
            ForgeSettingsView()
                .environmentObject(state)
                .frame(width: 480)
        }
    }
}

struct ForgeSidebarView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(spacing: ForgeSpacing.md) {
            Button {
                state.startDraft()
            } label: {
                Label("新项目", systemImage: "plus")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, ForgeSpacing.md)
            .padding(.vertical, ForgeSpacing.sm)
            .background(.quaternary.opacity(state.productPlan == nil ? 0.55 : 0), in: RoundedRectangle(cornerRadius: ForgeRadius.control, style: .continuous))

            List {
                Section("项目") {
                    ForEach(state.workspaces) { workspace in
                        ForgeWorkspaceRow(workspace: workspace)
                    }
                }
            }
            .listStyle(.sidebar)

            VStack(alignment: .leading, spacing: ForgeSpacing.xs) {
                Label(state.connectionMessage, systemImage: "server.rack")
                    .font(.caption)
                    .foregroundStyle(state.isConnected ? Color.secondary : Color.red)
                Text(state.endpointString)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, ForgeSpacing.md)
            .padding(.bottom, ForgeSpacing.md)
        }
        .padding(.top, ForgeSpacing.md)
    }
}

private struct ForgeWorkspaceRow: View {
    @EnvironmentObject private var state: ForgeAppState
    let workspace: ForgeWorkspaceSummary

    var isSelected: Bool {
        state.selectedWorkspaceId == workspace.id
    }

    var body: some View {
        HStack(spacing: ForgeSpacing.sm) {
            Button {
                Task { await state.selectWorkspace(workspace) }
            } label: {
                Label {
                    Text(workspace.displayTitle)
                        .lineLimit(1)
                } icon: {
                    Image(systemName: "cube.transparent")
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)

            Menu {
                Button("刷新计划") {
                    Task { await state.selectWorkspace(workspace) }
                }
                Button("打开为当前项目") {
                    Task { await state.selectWorkspace(workspace) }
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundStyle(.secondary)
            }
            .menuStyle(.button)
            .buttonStyle(.borderless)
        }
        .padding(.vertical, ForgeSpacing.xxs)
        .padding(.horizontal, ForgeSpacing.xs)
        .background(isSelected ? Color.accentColor.opacity(0.16) : .clear, in: RoundedRectangle(cornerRadius: ForgeRadius.control, style: .continuous))
    }
}

struct ForgeThreadView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(spacing: 0) {
            ForgeThreadHeader()
            Divider()
            ScrollView {
                LazyVStack(alignment: .leading, spacing: ForgeSpacing.md) {
                    if let plan = state.productPlan {
                        ForEach(plan.conversation) { turn in
                            ForgeTurnBubble(turn: turn)
                        }
                    } else {
                        ForgeDraftEmptyState()
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(ForgeSpacing.lg)
            }
            Divider()
            ForgeComposerView()
        }
        .background(.background)
    }
}

private struct ForgeThreadHeader: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        HStack(spacing: ForgeSpacing.md) {
            VStack(alignment: .leading, spacing: ForgeSpacing.xxs) {
                Text(state.productPlan?.title ?? "新硬件原型")
                    .font(.headline)
                    .lineLimit(1)
                Text("\(state.runtimeProvider.title) · \(state.productPlan?.currentRevision?.modelStatusTitle ?? "等待输入")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if state.isLoading {
                ProgressView()
                    .controlSize(.small)
            }
        }
        .padding(.horizontal, ForgeSpacing.lg)
        .padding(.vertical, ForgeSpacing.md)
    }
}

private struct ForgeDraftEmptyState: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.md) {
            Image(systemName: state.isConnected ? "sparkles.rectangle.stack" : "exclamationmark.triangle")
                .font(.system(size: 34))
                .foregroundStyle(state.isConnected ? Color.secondary : Color.orange)
            Text(state.isConnected ? "描述一个硬件想法" : "本地 Forge API 未连接")
                .font(.title3.weight(.semibold))
            Text(state.isConnected ? "Forge Mac 会通过本地 Forge API 创建 ProductPlan，并把范围、零件清单、风险限制、报价区间和 3D 模型状态保留在现有工作区。" : state.offlineGuidance)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if !state.isConnected {
                Button {
                    Task { await state.reconnect() }
                } label: {
                    Label("重新连接", systemImage: "arrow.clockwise")
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(ForgeSpacing.xl)
        .frame(maxWidth: 480, alignment: .leading)
        .forgeGlassPanel(radius: ForgeRadius.popover, shadow: true)
    }
}

private struct ForgeTurnBubble: View {
    let turn: ForgeTurn

    var body: some View {
        HStack {
            if turn.isUser { Spacer(minLength: 56) }
            Text(turn.text)
                .font(.body)
                .textSelection(.enabled)
                .padding(.horizontal, ForgeSpacing.md)
                .padding(.vertical, ForgeSpacing.sm)
                .foregroundStyle(turn.isUser ? .white : .primary)
                .background(turn.isUser ? Color.accentColor : Color.secondary.opacity(0.10), in: RoundedRectangle(cornerRadius: ForgeRadius.popover, style: .continuous))
                .frame(maxWidth: 560, alignment: turn.isUser ? .trailing : .leading)
            if !turn.isUser { Spacer(minLength: 56) }
        }
        .frame(maxWidth: .infinity, alignment: turn.isUser ? .trailing : .leading)
    }
}

private struct ForgeComposerView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.sm) {
            if !state.errorMessage.isEmpty {
                Label(state.errorMessage, systemImage: "exclamationmark.triangle")
                    .font(.caption)
                    .foregroundStyle(.red)
                    .lineLimit(2)
            }

            HStack(alignment: .bottom, spacing: ForgeSpacing.md) {
                TextEditor(text: $state.prompt)
                    .font(.body)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 58, idealHeight: 72, maxHeight: 110)
                    .padding(ForgeSpacing.xs)
                    .background(.background.opacity(0.65), in: RoundedRectangle(cornerRadius: ForgeRadius.control, style: .continuous))
                    .overlay(alignment: .topLeading) {
                        if state.prompt.isEmpty {
                            Text("输入硬件需求或修改，例如：加两个右侧按钮，生成模型")
                                .foregroundStyle(.tertiary)
                                .padding(.horizontal, ForgeSpacing.md)
                                .padding(.vertical, ForgeSpacing.sm)
                                .allowsHitTesting(false)
                        }
                    }

                Button {
                    Task { await state.sendPrompt() }
                } label: {
                    Image(systemName: state.isLoading ? "stop.fill" : "paperplane.fill")
                        .frame(width: 30, height: 30)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(state.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || state.isLoading || !state.isConnected)
            }
        }
        .padding(ForgeSpacing.lg)
    }
}

struct ForgeInspectorView: View {
    @EnvironmentObject private var state: ForgeAppState
    @State private var showingWebPreview = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ForgeSpacing.lg) {
                ForgePreviewSection(showingWebPreview: $showingWebPreview)
                ForgePlanFactsSection()
                ForgeModulesSection()
                ForgeRiskSection()
            }
            .padding(ForgeSpacing.lg)
        }
        .background(.thinMaterial)
    }
}

private struct ForgePreviewSection: View {
    @EnvironmentObject private var state: ForgeAppState
    @Binding var showingWebPreview: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.md) {
            HStack {
                Label("原型结构预览（3D）", systemImage: "cube")
                    .font(.headline)
                Spacer()
                Toggle("网页预览", isOn: $showingWebPreview)
                    .toggleStyle(.switch)
                    .controlSize(.small)
            }

            if showingWebPreview, let url = state.previewURL {
                ForgeWebPreview(url: url)
                    .frame(height: 260)
                    .clipShape(RoundedRectangle(cornerRadius: ForgeRadius.preview, style: .continuous))
            } else {
                VStack(spacing: ForgeSpacing.sm) {
                    Image(systemName: "cube.transparent")
                        .font(.system(size: 42, weight: .light))
                        .foregroundStyle(.secondary)
                    Text(state.productPlan?.currentRevision?.modelStatusTitle ?? "等待 ProductPlan")
                        .font(.headline)
                    Text("第一版 Mac 客户端用原生 inspector 展示状态；需要查看完整 Three.js 预览时打开网页预览。")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .background(.black.opacity(0.04), in: RoundedRectangle(cornerRadius: ForgeRadius.preview, style: .continuous))
            }
        }
        .padding(ForgeSpacing.md)
        .forgeGlassPanel(radius: ForgeRadius.panel)
    }
}

private struct ForgePlanFactsSection: View {
    @EnvironmentObject private var state: ForgeAppState

    var plan: ForgeStructuredProductPlan? {
        state.productPlan?.currentRevision?.productPlanSnapshot
    }

    var revision: ForgeRevision? {
        state.productPlan?.currentRevision
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.sm) {
            Text("方案摘要")
                .font(.headline)
            ForgeFactRow(label: "范围", value: plan?.productType ?? "待解析")
            ForgeFactRow(label: "外壳路径", value: shellPath)
            ForgeFactRow(label: "屏幕", value: screenText)
            ForgeFactRow(label: "报价区间", value: revision?.quoteRange ?? "待估算")
            ForgeFactRow(label: "3D 模型状态", value: revision?.modelStatusTitle ?? "等待输入")
        }
        .padding(ForgeSpacing.md)
        .forgeGlassPanel(radius: ForgeRadius.panel)
    }

    private var shellPath: String {
        let method = plan?.constraints?.manufacturingMethod ?? "fdm_3d_printing"
        let finish = plan?.constraints?.finish ?? "默认"
        return "\(finish) · \(method)"
    }

    private var screenText: String {
        guard let size = plan?.requirements?.displaySizeInches else {
            return "待确认"
        }
        return "\(String(format: "%.1f", size)) inch"
    }
}

private struct ForgeModulesSection: View {
    @EnvironmentObject private var state: ForgeAppState

    var modules: [ForgeModule] {
        state.productPlan?.currentRevision?.modules ?? []
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.sm) {
            Text("零件清单（BOM）")
                .font(.headline)
            if modules.isEmpty {
                Text("等待 Forge 生成零件清单。")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(modules, id: \.stableId) { module in
                    HStack {
                        Text(module.displayName)
                            .lineLimit(1)
                        Spacer()
                        if let quantity = module.quantity {
                            Text("x\(quantity)")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .font(.callout)
                    Divider()
                }
            }
        }
        .padding(ForgeSpacing.md)
        .forgeGlassPanel(radius: ForgeRadius.panel)
    }
}

private struct ForgeRiskSection: View {
    @EnvironmentObject private var state: ForgeAppState

    var revision: ForgeRevision? {
        state.productPlan?.currentRevision
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.sm) {
            Text("风险限制")
                .font(.headline)
            ForgeFactRow(label: "状态", value: state.productPlan?.status ?? "等待输入")
            ForgeFactRow(label: "风险项", value: "\(revision?.riskItemCount ?? 0)")
            Text("相机、电池和运动结构仍按 Forge 现有规则进入人工审核或阻塞路径。")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(ForgeSpacing.md)
        .forgeGlassPanel(radius: ForgeRadius.panel)
    }
}

private struct ForgeFactRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer(minLength: ForgeSpacing.md)
            Text(value)
                .multilineTextAlignment(.trailing)
                .textSelection(.enabled)
        }
        .font(.callout)
    }
}

struct ForgeSettingsView: View {
    @EnvironmentObject private var state: ForgeAppState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.lg) {
            HStack {
                Text("Forge 设置")
                    .font(.title2.weight(.semibold))
                Spacer()
                Button("完成") { dismiss() }
                    .keyboardShortcut(.defaultAction)
            }

            Form {
                TextField("Forge API", text: $state.endpointString)
                Picker("运行模式", selection: $state.runtimeProvider) {
                    ForEach(ForgeRuntimeProvider.allCases) { provider in
                        Text(provider.title).tag(provider)
                    }
                }
                Picker("语言", selection: $state.language) {
                    Text("简体中文").tag("zh")
                    Text("English").tag("en")
                }
            }
            .formStyle(.grouped)

            HStack {
                Button {
                    Task { await state.reconnect() }
                } label: {
                    Label("测试连接", systemImage: "network")
                }
                Button {
                    Task { await state.reconnect() }
                } label: {
                    Label("刷新项目", systemImage: "arrow.clockwise")
                }
                Spacer()
            }
        }
        .padding(ForgeSpacing.xl)
    }
}
