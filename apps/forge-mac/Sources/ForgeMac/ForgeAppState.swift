import Foundation
import SwiftUI

@MainActor
final class ForgeAppState: ObservableObject {
    @Published var endpointString: String {
        didSet { UserDefaults.standard.set(endpointString, forKey: "forgeMac.endpoint") }
    }
    @Published var runtimeProvider: ForgeRuntimeProvider {
        didSet { UserDefaults.standard.set(runtimeProvider.rawValue, forKey: "forgeMac.runtimeProvider") }
    }
    @Published var language: String {
        didSet { UserDefaults.standard.set(language, forKey: "forgeMac.language") }
    }
    @Published var workspaces: [ForgeWorkspaceSummary] = []
    @Published var selectedWorkspaceId: String?
    @Published var productPlan: ForgeProductPlan?
    @Published var prompt: String = ""
    @Published var isLoading = false
    @Published var isConnected = false
    @Published var connectionMessage = "未连接"
    @Published var errorMessage = ""
    @Published var showingSettings = false

    init() {
        endpointString = UserDefaults.standard.string(forKey: "forgeMac.endpoint") ?? "http://127.0.0.1:8765"
        runtimeProvider = ForgeRuntimeProvider(rawValue: UserDefaults.standard.string(forKey: "forgeMac.runtimeProvider") ?? "") ?? .codex
        language = UserDefaults.standard.string(forKey: "forgeMac.language") ?? "zh"
    }

    var client: ForgeClient? {
        guard let url = endpointURL else {
            return nil
        }
        return ForgeClient(baseURL: url)
    }

    var endpointURL: URL? {
        URL(string: endpointString.trimmingCharacters(in: .whitespacesAndNewlines))
    }

    var selectedWorkspace: ForgeWorkspaceSummary? {
        workspaces.first(where: { $0.id == selectedWorkspaceId })
    }

    var activeSessionId: String {
        "session_\(productPlan?.planId ?? selectedWorkspaceId ?? "draft")"
    }

    var serverStartCommand: String {
        "npm start"
    }

    var offlineGuidance: String {
        "先在 Forge 仓库根目录启动本地服务：\(serverStartCommand)"
    }

    var previewModelURL: URL? {
        guard let root = endpointURL else { return nil }
        return productPlan?.currentRevision?.modelGlbURL(baseURL: root)
    }

    func bootstrap() async {
        if await checkConnection() {
            await refreshWorkspaces(selectFirst: true)
        }
    }

    @discardableResult
    func checkConnection() async -> Bool {
        guard let client else {
            isConnected = false
            connectionMessage = "API 地址无效"
            errorMessage = "Forge API 地址无效。"
            return false
        }
        do {
            let health = try await client.health()
            isConnected = health.ok
            connectionMessage = health.ok ? "已连接 Forge API" : "Forge API 未就绪"
            if health.ok {
                errorMessage = ""
            }
            return health.ok
        } catch {
            isConnected = false
            connectionMessage = "未连接本地 Forge API"
            errorMessage = "\(offlineGuidance)。\(error.localizedDescription)"
            return false
        }
    }

    func reconnect() async {
        if await checkConnection() {
            await refreshWorkspaces(selectFirst: selectedWorkspaceId == nil && productPlan == nil)
        }
    }

    func refreshWorkspaces(selectFirst: Bool = false) async {
        guard isConnected else {
            if errorMessage.isEmpty {
                errorMessage = offlineGuidance
            }
            return
        }
        guard let client else {
            errorMessage = "API 地址无效"
            return
        }
        do {
            let response = try await client.workspaces(limit: 18)
            workspaces = response.workspaces
            if selectFirst, selectedWorkspaceId == nil, let first = workspaces.first {
                await selectWorkspace(first)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func selectWorkspace(_ workspace: ForgeWorkspaceSummary) async {
        guard isConnected else {
            errorMessage = offlineGuidance
            return
        }
        guard let client else { return }
        selectedWorkspaceId = workspace.id
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            let response = try await client.plan(workspaceId: workspace.id)
            productPlan = response.productPlan
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func startDraft() {
        selectedWorkspaceId = nil
        productPlan = nil
        prompt = ""
        errorMessage = ""
    }

    func sendPrompt() async {
        let message = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, let client else { return }
        guard isConnected else {
            errorMessage = offlineGuidance
            return
        }
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            let response: ForgePlanResponse
            if let planId = productPlan?.planId {
                response = try await client.sendTurn(
                    workspaceId: planId,
                    sessionId: activeSessionId,
                    message: message,
                    runtimeProvider: runtimeProvider
                )
            } else {
                response = try await client.createPlan(
                    message: message,
                    language: language,
                    runtimeProvider: runtimeProvider
                )
            }
            if let plan = response.productPlan {
                productPlan = plan
                selectedWorkspaceId = plan.planId
                prompt = ""
                await refreshWorkspaces(selectFirst: false)
            } else {
                errorMessage = "Forge API did not return a ProductPlan."
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
