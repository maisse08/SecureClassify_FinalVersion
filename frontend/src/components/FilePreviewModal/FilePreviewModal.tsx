import { useState, useEffect, useCallback } from "react";
import { X, Download, ZoomIn, ZoomOut, FileText, FileType2, FileSpreadsheet, FileCode, Image, File, AlertCircle, Loader2 } from "lucide-react";
import { dataService } from "../../services/data.service";
import mammoth from "mammoth";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FilePreviewModalProps {
    dataId: string;
    file: {
        filename: string;
        originalName: string;
        size: number;
        mimeType?: string;
    };
    onClose: () => void;
}

type FileCategory = "image" | "pdf" | "text" | "docx" | "unsupported";

const getFileCategory = (filename: string): FileCategory => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const pdfExts = ["pdf"];
    const textExts = ["txt", "py", "js", "ts", "java", "c", "cpp", "cs", "html", "css", "json", "xml", "md", "sql", "yml", "yaml"];
    const docxExts = ["doc", "docx"];

    if (imageExts.includes(ext)) return "image";
    if (pdfExts.includes(ext)) return "pdf";
    if (textExts.includes(ext)) return "text";
    if (docxExts.includes(ext)) return "docx";
    return "unsupported";
};

const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const pdfExts = ["pdf"];
    const textExts = ["txt", "py", "js", "ts", "java", "c", "cpp", "cs", "html", "css", "json", "xml", "md", "sql", "yml", "yaml"];
    const officeExts = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

    if (imageExts.includes(ext)) return { icon: Image, color: "#10b981" };
    if (pdfExts.includes(ext)) return { icon: FileType2, color: "#ef4444" };
    if (textExts.includes(ext)) return { icon: FileCode, color: "#3b82f6" };
    if (officeExts.includes(ext)) return { icon: FileSpreadsheet, color: "#f59e0b" };
    return { icon: File, color: "#6b7280" };
};

const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const languageMap: Record<string, string> = {
        "py": "python",
        "js": "javascript",
        "ts": "typescript",
        "java": "java",
        "c": "c",
        "cpp": "cpp",
        "cs": "csharp",
        "html": "html",
        "css": "css",
        "json": "json",
        "xml": "xml",
        "md": "markdown",
        "sql": "sql",
        "yml": "yaml",
        "yaml": "yaml",
        "txt": "text"
    };
    return languageMap[ext] || "text";
};

export const FilePreviewModal = ({ dataId, file, onClose }: FilePreviewModalProps) => {
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(true);
    const [previewError, setPreviewError] = useState("");
    const [imageZoom, setImageZoom] = useState(100);
    const [textContent, setTextContent] = useState<string>("");
    const [docxHtml, setDocxHtml] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);

    const fileCategory = getFileCategory(file.originalName);
    const { icon: FileIcon, color } = getFileIcon(file.originalName);

    // Load preview file
    useEffect(() => {
        const loadPreview = async () => {
            try {
                setPreviewLoading(true);
                setPreviewError("");

                if (fileCategory === "text") {
                    // Load as text for syntax highlighting
                    const blob = await dataService.getFileBlob(dataId, file.filename, false);
                    const text = await blob.text();
                    setTextContent(text);
                } else if (fileCategory === "docx") {
                    // Load DOCX and convert to HTML
                    const blob = await dataService.getFileBlob(dataId, file.filename, false);
                    const arrayBuffer = await blob.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocxHtml(result.value);
                } else if (fileCategory === "image" || fileCategory === "pdf") {
                    // Load as blob for image/PDF
                    const blob = await dataService.getFileBlob(dataId, file.filename, false);
                    const url = window.URL.createObjectURL(blob);
                    setPreviewBlobUrl(url);
                }
            } catch (err: any) {
                setPreviewError(err.response?.data?.message || "Failed to load preview");
            } finally {
                setPreviewLoading(false);
            }
        };

        loadPreview();

        return () => {
            if (previewBlobUrl) {
                window.URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [dataId, file.filename, fileCategory]);

    const handleDownload = async () => {
        try {
            setPreviewLoading(true);
            setPreviewError("");
            const blob = await dataService.getFileBlob(dataId, file.filename, true);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setPreviewError(err.response?.data?.message || "Failed to download file");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 25, 25));
    const handleZoomReset = () => setImageZoom(100);

    const handleImageMouseDown = () => setIsDragging(true);
    const handleImageMouseUp = () => setIsDragging(false);
    const handleImageMouseLeave = () => setIsDragging(false);

    const renderPreview = () => {
        if (previewError) {
            return (
                <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "40px" }}>
                    <AlertCircle size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <div>{previewError}</div>
                </div>
            );
        }

        if (previewLoading) {
            return (
                <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "40px" }}>
                    <Loader2 size={48} className="spin" style={{ marginBottom: "12px" }} />
                    <div>Loading preview...</div>
                </div>
            );
        }

        switch (fileCategory) {
            case "image":
                return (
                    <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        overflow: "auto", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        cursor: isDragging ? "grabbing" : "grab"
                    }}>
                        <img
                            src={previewBlobUrl || ""}
                            alt={file.originalName}
                            style={{ 
                                maxWidth: `${imageZoom}%`, 
                                maxHeight: `${imageZoom}%`, 
                                borderRadius: "4px",
                                transition: "transform 0.2s ease",
                                userSelect: "none"
                            }}
                            draggable={false}
                            onMouseDown={handleImageMouseDown}
                            onMouseUp={handleImageMouseUp}
                            onMouseLeave={handleImageMouseLeave}
                        />
                    </div>
                );

            case "pdf":
                return (
                    <iframe
                        src={previewBlobUrl || ""}
                        style={{ width: "100%", height: "100%", border: "none", borderRadius: "4px" }}
                        title={file.originalName}
                    />
                );

            case "text":
                const language = getLanguageFromExtension(file.originalName);
                return (
                    <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        overflow: "auto", 
                        background: "#282c34", 
                        borderRadius: "4px",
                        padding: "16px"
                    }}>
                        <SyntaxHighlighter
                            language={language}
                            style={oneDark}
                            showLineNumbers
                            wrapLines
                            wrapLongLines
                            customStyle={{
                                margin: 0,
                                padding: "16px",
                                background: "transparent",
                                fontSize: "0.85rem",
                                fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
                            }}
                        >
                            {textContent}
                        </SyntaxHighlighter>
                    </div>
                );

            case "docx":
                return (
                    <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        overflow: "auto", 
                        background: "var(--surface)", 
                        borderRadius: "4px",
                        padding: "24px",
                        fontFamily: "'Georgia', serif",
                        lineHeight: "1.6",
                        color: "var(--text-main)"
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
                    </div>
                );

            case "unsupported":
            default:
                return (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <File size={64} color="#6b7280" style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px" }}>
                            Preview is not available for this file type.
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>
                            File: {file.originalName}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                            {(file.size / 1024).toFixed(1)} KB • {file.mimeType || "Unknown type"}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div 
                className="modal" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    maxWidth: "90vw", 
                    width: "900px",
                    maxHeight: "90vh", 
                    overflow: "hidden", 
                    display: "flex", 
                    flexDirection: "column" 
                }}
            >
                {/* Header */}
                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <FileIcon size={24} color={color} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>File Preview</h3>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                {file.originalName}
                            </div>
                        </div>
                    </div>
                    <button 
                        className="btn btn-sm" 
                        onClick={onClose}
                        style={{ background: "var(--surface-inset)" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* File info bar */}
                <div style={{ 
                    display: "flex", 
                    gap: "12px", 
                    alignItems: "center", 
                    padding: "10px 12px", 
                    background: "var(--surface-inset)", 
                    borderRadius: "8px", 
                    marginBottom: "12px", 
                    fontSize: "0.85rem",
                    flexWrap: "wrap"
                }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Size:</span> <strong>{(file.size / 1024).toFixed(1)} KB</strong>
                        <span style={{ margin: "0 8px", color: "var(--text-tertiary)" }}>•</span>
                        <span style={{ color: "var(--text-tertiary)" }}>Type:</span> <strong>{file.mimeType || "Unknown"}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        {/* Zoom controls for images */}
                        {fileCategory === "image" && (
                            <>
                                <button 
                                    className="btn btn-sm" 
                                    onClick={handleZoomOut}
                                    disabled={imageZoom <= 25}
                                    style={{ background: "var(--surface)", color: "var(--text-main)" }}
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    onClick={handleZoomReset}
                                    style={{ background: "var(--surface)", color: "var(--text-main)", minWidth: "60px" }}
                                    title="Reset Zoom"
                                >
                                    {imageZoom}%
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    onClick={handleZoomIn}
                                    disabled={imageZoom >= 200}
                                    style={{ background: "var(--surface)", color: "var(--text-main)" }}
                                    title="Zoom In"
                                >
                                    <ZoomIn size={14} />
                                </button>
                            </>
                        )}

                        <button 
                            onClick={handleDownload}
                            className="btn btn-sm"
                            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                            disabled={previewLoading}
                        >
                            <Download size={14} /> {previewLoading ? "Loading..." : "Download"}
                        </button>
                    </div>
                </div>

                {/* Preview area */}
                <div style={{ 
                    flex: 1, 
                    overflow: "hidden",
                    background: fileCategory === "text" ? "#282c34" : "var(--surface-inset)", 
                    borderRadius: "8px", 
                    minHeight: "500px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {renderPreview()}
                </div>
            </div>
        </div>
    );
};