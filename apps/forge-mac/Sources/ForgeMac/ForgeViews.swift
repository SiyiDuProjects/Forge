import SwiftUI

struct ForgeRootView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        NavigationSplitView {
            ForgeSidebarView()
                .navigationSplitViewColumnWidth(min: 220, ideal: 260, max: 320)
        } detail: {
            ForgeWorkbenchDetailView()
        }
        .sheet(isPresented: $state.showingSettings) {
            ForgeSettingsView()
                .environmentObject(state)
                .frame(width: 480)
        }
    }
}

private struct ForgeWorkbenchDetailView: View {
    var body: some View {
        HStack(spacing: 0) {
            ForgeThreadView()
                .frame(minWidth: 420, maxWidth: .infinity)
            ForgeInspectorView()
                .frame(minWidth: 320, idealWidth: 380, maxWidth: 460)
        }
    }
}

struct ForgeSidebarView: View {
    @EnvironmentObject private var state: ForgeAppState

    private var workspaceSelection: Binding<String?> {
        Binding {
            state.selectedWorkspaceId
        } set: { selectedId in
            guard state.selectedWorkspaceId != selectedId else {
                return
            }
            state.selectedWorkspaceId = selectedId
            guard
                let selectedId,
                let workspace = state.workspaces.first(where: { $0.id == selectedId })
            else {
                return
            }
            Task { await state.selectWorkspace(workspace) }
        }
    }

    var body: some View {
        VStack(spacing: ForgeSpacing.sm) {
            Button {
                state.startDraft()
            } label: {
                Label("新项目", systemImage: "plus")
                    .font(.callout)
                    .labelStyle(.titleAndIcon)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(height: ForgeSidebarMetric.primaryRowHeight)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, ForgeSpacing.md)
            .forgeSystemBubble(isActive: state.productPlan == nil)
            .padding(.horizontal, ForgeSidebarMetric.horizontalInset)
            .padding(.top, ForgeSidebarMetric.topInset)

            List(selection: workspaceSelection) {
                Section("项目") {
                    ForEach(state.workspaces) { workspace in
                        ForgeWorkspaceRow(workspace: workspace)
                    }
                }
            }
            .listStyle(.sidebar)
            .tint(ForgeFill.projectRowSelected)

            Button {
                state.showingSettings = true
            } label: {
                VStack(alignment: .leading, spacing: ForgeSpacing.xs) {
                    Label("Forge 设置", systemImage: "gearshape")
                        .font(.callout.weight(.medium))
                    Label(state.connectionMessage, systemImage: "server.rack")
                        .font(.caption)
                        .foregroundStyle(state.isConnected ? Color.secondary : Color.red)
                    Text(state.endpointString)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, ForgeSpacing.md)
            .padding(.vertical, ForgeSpacing.sm)
            .forgeGlassPanel(radius: ForgeRadius.popover)
            .padding(.horizontal, ForgeSpacing.md)
            .padding(.bottom, ForgeSpacing.md)
        }
    }
}

private struct ForgeWorkspaceRow: View {
    @EnvironmentObject private var state: ForgeAppState
    let workspace: ForgeWorkspaceSummary

    var body: some View {
        Text(workspace.displayTitle)
            .lineLimit(1)
            .tag(workspace.id)
            .contextMenu {
                Button("打开为当前项目") {
                    Task { await state.selectWorkspace(workspace) }
                }
                Button("刷新计划") {
                    Task { await state.selectWorkspace(workspace) }
                }
            }
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
                .padding(.horizontal, turn.isUser ? ForgeSpacing.md : 0)
                .padding(.vertical, turn.isUser ? ForgeSpacing.sm : ForgeSpacing.xxs)
                .foregroundStyle(.primary)
                .forgeSystemBubble(isActive: turn.isUser)
                .frame(maxWidth: 560, alignment: turn.isUser ? .trailing : .leading)
            if !turn.isUser { Spacer(minLength: 56) }
        }
        .frame(maxWidth: .infinity, alignment: turn.isUser ? .trailing : .leading)
    }
}

private struct ForgeComposerView: View {
    @EnvironmentObject private var state: ForgeAppState

    private var canSend: Bool {
        !state.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && state.isConnected && !state.isLoading
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.sm) {
            if !state.errorMessage.isEmpty {
                Label(state.errorMessage, systemImage: "exclamationmark.triangle")
                    .font(.caption)
                    .foregroundStyle(.red)
                    .lineLimit(2)
                    .padding(.horizontal, ForgeSpacing.md)
            }

            ZStack(alignment: .topLeading) {
                TextField("输入硬件需求或修改，例如：加两个右侧按钮，生成模型", text: $state.prompt, axis: .vertical)
                    .font(.body)
                    .textFieldStyle(.plain)
                    .lineLimit(1...5)
                    .submitLabel(.send)
                    .padding(.trailing, 48)
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                    .onSubmit {
                        guard canSend else {
                            return
                        }
                        Task { await state.sendPrompt() }
                    }

                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button {
                            Task { await state.sendPrompt() }
                        } label: {
                            Image(systemName: "paperplane.fill")
                        }
                        .buttonStyle(.borderedProminent)
                        .buttonBorderShape(.circle)
                        .controlSize(.large)
                        .disabled(!canSend)
                        .accessibilityLabel("发送")
                    }
                }
            }
            .frame(height: 74, alignment: .topLeading)
            .padding(.horizontal, ForgeSpacing.lg)
            .padding(.top, ForgeSpacing.lg)
            .padding(.bottom, ForgeSpacing.md)
            .forgeGlassPanel(radius: ForgeRadius.glassBubble, shadow: true)
        }
        .padding(.horizontal, ForgeSpacing.lg)
        .padding(.top, ForgeSpacing.md)
        .padding(.bottom, ForgeSpacing.sm)
    }
}

struct ForgeThreadView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(spacing: 0) {
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

struct ForgeInspectorView: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ForgeSpacing.lg) {
                ForgePreviewSection()
                ForgePlanFactsSection()
                ForgeModulesSection()
                ForgeRiskSection()
            }
            .padding(ForgeSpacing.lg)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .forgeGlassPanel(radius: ForgeRadius.glassBubble, shadow: true)
        .padding(.leading, ForgeSpacing.sm)
        .padding(.trailing, ForgeSpacing.md)
        .padding(.vertical, ForgeSpacing.md)
    }
}

private struct ForgePreviewSection: View {
    @EnvironmentObject private var state: ForgeAppState

    var body: some View {
        VStack(alignment: .leading, spacing: ForgeSpacing.md) {
            HStack {
                Label("原型结构预览（3D）", systemImage: "cube")
                    .font(.headline)
                Spacer()
                Text(state.productPlan?.currentRevision?.modelStatusTitle ?? "等待 ProductPlan")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let modelURL = state.previewModelURL,
               let serverURL = state.endpointURL {
                ForgeWebPreview(modelURL: modelURL, serverURL: serverURL)
                    .frame(height: 260)
                    .clipShape(RoundedRectangle(cornerRadius: ForgeRadius.preview, style: .continuous))
            } else {
                VStack(spacing: ForgeSpacing.sm) {
                    Image(systemName: "cube.transparent")
                        .font(.system(size: 42, weight: .light))
                        .foregroundStyle(.secondary)
                    Text(state.productPlan?.currentRevision?.modelStatusTitle ?? "等待 ProductPlan")
                        .font(.headline)
                    Text("生成确认完成后，这里会直接加载当前版本的 3D 模型。")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .background(.black.opacity(0.04), in: RoundedRectangle(cornerRadius: ForgeRadius.preview, style: .continuous))
            }
        }
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
                Spacer()
            }
        }
        .padding(ForgeSpacing.xl)
    }
}
