import Foundation

enum JSONValue: Codable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            self = .object(try container.decode([String: JSONValue].self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    subscript(key: String) -> JSONValue? {
        if case .object(let object) = self {
            object[key]
        } else {
            nil
        }
    }

    var stringValue: String? {
        if case .string(let value) = self { value } else { nil }
    }

    var numberValue: Double? {
        if case .number(let value) = self { value } else { nil }
    }

    var boolValue: Bool? {
        if case .bool(let value) = self { value } else { nil }
    }

    var arrayValue: [JSONValue] {
        if case .array(let value) = self { value } else { [] }
    }

    var objectValue: [String: JSONValue] {
        if case .object(let value) = self { value } else { [:] }
    }
}

struct ForgeWorkspaceListResponse: Decodable {
    let ok: Bool?
    let workspaces: [ForgeWorkspaceSummary]
}

struct ForgeWorkspaceSummary: Decodable, Identifiable, Hashable {
    let projectId: String?
    let workspaceId: String?
    let title: String?
    let status: String?
    let currentRevisionId: String?
    let updatedAt: String?
    let runtimeBinding: JSONValue?

    var id: String {
        workspaceId ?? projectId ?? title ?? "workspace"
    }

    var displayTitle: String {
        let trimmed = (title ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "未命名原型方案" : trimmed
    }
}

struct ForgePlanResponse: Decodable {
    let ok: Bool?
    let workspaceId: String?
    let productPlan: ForgeProductPlan?
    let revision: ForgeRevision?
    let assistantMessage: JSONValue?
    let pendingConfirmation: ForgePendingConfirmation?
    let runtimeProvider: String?
    let modelProvider: String?
    let runtimeBinding: JSONValue?
    let bindingId: String?
}

struct ForgeHealthResponse: Decodable {
    let ok: Bool
    let service: String?
    let contractVersion: String?
}

struct ForgeProductPlan: Decodable, Identifiable, Hashable {
    let planId: String
    let status: String?
    let currentRevisionId: String?
    let requiredInputs: JSONValue?
    let conversation: [ForgeTurn]
    let revisions: [ForgeRevision]
    let workspaceState: JSONValue?
    let language: String?
    let createdAt: String?
    let updatedAt: String?

    var id: String { planId }

    var title: String {
        workspaceState?["title"]?.stringValue
            ?? currentRevision?.requestText
            ?? currentRevision?.productPlanSnapshot?.userIntent
            ?? conversation.first(where: { $0.role == "user" })?.text
            ?? "Forge hardware prototype"
    }

    var currentRevision: ForgeRevision? {
        if let currentRevisionId {
            return revisions.first(where: { $0.revisionId == currentRevisionId }) ?? revisions.last
        }
        return revisions.last
    }
}

struct ForgeTurn: Decodable, Identifiable, Hashable {
    let turnId: String?
    let role: String
    let text: String
    let createdAt: String?

    var id: String { turnId ?? "\(role)-\(createdAt ?? text)" }
    var isUser: Bool { role == "user" }
}

struct ForgeRevision: Decodable, Identifiable, Hashable {
    let revisionId: String
    let productCategory: String?
    let requestText: String?
    let productPlanSnapshot: ForgeStructuredProductPlan?
    let modules: [ForgeModule]?
    let riskReport: JSONValue?
    let quote: JSONValue?
    let geometrySpec: JSONValue?
    let modelArtifacts: JSONValue?
    let geometryValidation: JSONValue?
    let generationStatus: String?
    let generationConfirmed: Bool?
    let modelPreview: JSONValue?
    let electronicsLayout: JSONValue?
    let createdAt: String?

    var id: String { revisionId }

    var modelStatusTitle: String {
        switch generationStatus {
        case "generated":
            "3D 模型已生成"
        case "blocked":
            "需要人工扩展"
        case "pending_confirmation":
            "等待生成确认"
        default:
            generationStatus ?? "状态未知"
        }
    }

    var modelGlbPath: String? {
        let artifacts = modelArtifacts?["artifacts"]?["glb"] ?? modelPreview?["assets"]?["glb"]
        let path = artifacts?["url"]?.stringValue ?? artifacts?["localPath"]?.stringValue
        return path?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    func modelGlbURL(baseURL: URL) -> URL? {
        guard let path = modelGlbPath else { return nil }
        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }
        return URL(string: path, relativeTo: baseURL)?.absoluteURL
    }

    var quoteRange: String {
        quote?["quote_estimate_usd"]?["range"]?.stringValue
            ?? quote?["range"]?.stringValue
            ?? quote?["quoteBand"]?.stringValue
            ?? "待估算"
    }

    var riskItemCount: Int {
        riskReport?["items"]?.arrayValue.count ?? 0
    }
}

struct ForgeStructuredProductPlan: Decodable, Hashable {
    let productType: String?
    let userIntent: String?
    let requirements: ForgeRequirements?
    let constraints: ForgeConstraints?
    let assumptions: [String]?
    let risks: [String]?
}

struct ForgeRequirements: Decodable, Hashable {
    let display: Bool?
    let displaySizeInches: Double?
    let ambientSensor: Bool?
    let usbC: Bool?
    let battery: Bool?
    let camera: Bool?
    let speaker: Bool?
    let buzzer: Bool?
    let buttons: Int?
    let desktopUse: Bool?
    let wallMount: Bool?
    let portable: Bool?
}

struct ForgeConstraints: Decodable, Hashable {
    let manufacturingMethod: String?
    let material: String?
    let wallThicknessMm: Double?
    let clearanceMm: Double?
    let preferredStyle: String?
    let finish: String?
    let priority: String?
}

struct ForgeModule: Decodable, Identifiable, Hashable {
    let moduleId: String?
    let id: String?
    let name: String?
    let label: String?
    let componentType: String?
    let quantity: Int?

    var stableId: String {
        moduleId ?? id ?? name ?? label ?? componentType ?? UUID().uuidString
    }

    var displayName: String {
        name ?? label ?? componentType ?? "未知零件"
    }
}

struct ForgePendingConfirmation: Decodable, Hashable {
    let confirmationId: String?
    let summary: String?
    let message: String?
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
