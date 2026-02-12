import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";
import { EventEmitter } from "events";
import { Notice } from "obsidian";
import { print } from "../utils/logger";

const CONTENT_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
	".bmp": "image/bmp",
	".tif": "image/tiff",
	".tiff": "image/tiff",
	".svg": "image/svg+xml",
	".pdf": "application/pdf",
	".mp4": "video/mp4",
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
	".wav": "audio/wav",
	".json": "application/json",
	".xml": "application/xml",
	".ico": "image/x-icon",
	".txt": "text/plain",
	".csv": "text/csv",
	".html": "text/html",
	".css": "text/css",
	".js": "application/javascript",
};

export class EagleServer {
	private server: http.Server | null = null;
	private isRunning = false;
	private latestDirUrl: string | null = null;
	private watcher: chokidar.FSWatcher | null = null;
	private metadataCache = new Map<string, { name: string; ext: string; mtime: number }>();
	private readonly MAX_CACHE_SIZE = 1000;
	public readonly urlEmitter = new EventEmitter();

	constructor(private libraryPath: string, private port: number) {}

	/**
	 * 启动服务器
	 * @description 开启本地 HTTP 代理服务器并启动文件监听器 (chokidar)
	 */
	public start() {
		if (this.isRunning) return;

		const imagesPath = path.join(this.libraryPath, "images");

		this.watcher = chokidar.watch(imagesPath, {
			ignored: /(^|[\/\\])\../,
			persistent: true,
			depth: 1,
			ignoreInitial: true,
		});

		this.watcher.on("addDir", (dirPath: string) => {
			const relativePath = path.relative(this.libraryPath, dirPath).replace(/\\/g, "/");
			this.latestDirUrl = `http://localhost:${this.port}/${relativePath}`;
			this.urlEmitter.emit("urlUpdated", this.latestDirUrl);
		});

		this.server = http.createServer((req, res) => this.handleRequest(req, res));

		this.server.on("error", (e: any) => {
			if (e.code === "EADDRINUSE") {
				const msg = `Eagle Image Organizer: Port ${this.port} is in use. Please change the port in settings.`;
				console.error(msg);
				new Notice(msg, 10000);
				this.isRunning = false;
			} else {
				console.error("Eagle Image Organizer Server error:", e);
			}
		});

		this.server.listen(this.port, () => {
			this.isRunning = true;
			print(`Server is running at http://localhost:${this.port}/`);
		});
	}

	public stop() {
		if (this.watcher) {
			this.watcher.close().catch(err => console.error("Error closing watcher:", err));
			this.watcher = null;
		}

		if (this.isRunning && this.server) {
			this.server.close(() => {
				this.isRunning = false;
				print("Server stopped.");
			});
		}

		this.metadataCache.clear();
	}

	public getLatestUrl(): string | null {
		return this.latestDirUrl;
	}

	private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
		res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
		res.setHeader("Access-Control-Allow-Credentials", "true");

		const urlObj = new URL(req.url || "/", `http://${req.headers.host}`);
		const pathname = urlObj.pathname;

		if (pathname === "/latest") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ url: this.latestDirUrl }));
			return;
		}

		if (pathname === "/libraryPath") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ path: this.libraryPath }));
			return;
		}

		if (pathname.startsWith("/api/")) {
			if (req.method === "OPTIONS") {
				res.writeHead(204);
				res.end();
				return;
			}
			this.proxyToEagle(pathname + urlObj.search, req, res);
			return;
		}

		const decodedPath = decodeURIComponent(pathname);
		const filePath = path.join(this.libraryPath, decodedPath);

		if (!filePath.startsWith(path.join(this.libraryPath, "images") + path.sep)) {
			res.writeHead(404).end();
			return;
		}

		fs.stat(filePath, (err, stats) => {
			if (err) {
				res.writeHead(err.code === "ENOENT" ? 404 : 500).end();
				return;
			}

			if (stats.isDirectory()) {
				this.serveDirectory(filePath, res);
			} else {
				this.serveFile(filePath, res);
			}
		});
	}

	private serveDirectory(dirPath: string, res: http.ServerResponse) {
		const jsonFilePath = path.join(dirPath, "metadata.json");
		fs.stat(jsonFilePath, (err, jsonStats) => {
			if (err) {
				res.writeHead(404).end();
				return;
			}

			const cached = this.metadataCache.get(jsonFilePath);
			if (cached && cached.mtime >= jsonStats.mtimeMs) {
				this.serveActualImage(dirPath, cached.name, cached.ext, res);
				return;
			}

			fs.readFile(jsonFilePath, "utf8", (err, data) => {
				if (err) {
					res.writeHead(500).end("Internal Server Error");
					return;
				}
				try {
					const info = JSON.parse(data);
					const { name, ext } = info;

					if (this.metadataCache.size >= this.MAX_CACHE_SIZE) {
						const firstKey = this.metadataCache.keys().next().value;
						this.metadataCache.delete(firstKey);
					}
					this.metadataCache.set(jsonFilePath, { name, ext, mtime: jsonStats.mtimeMs });
					this.serveActualImage(dirPath, name, ext, res);
				} catch {
					res.writeHead(500).end("Invalid Metadata");
				}
			});
		});
	}

	private serveActualImage(dirPath: string, name: string, ext: string, res: http.ServerResponse) {
		const imagePath = path.join(dirPath, `${name}.${ext}`);
		if (ext === "url") {
			this.handleUrlFile(imagePath, res);
		} else {
			this.pipeFile(imagePath, `.${ext}`, res);
		}
	}

	private serveFile(filePath: string, res: http.ServerResponse) {
		res.setHeader("Cache-Control", "public, max-age=604800");
		const ext = path.extname(filePath).toLowerCase();
		if (ext === ".url") {
			this.handleUrlFile(filePath, res);
		} else {
			this.pipeFile(filePath, ext, res);
		}
	}

	private handleUrlFile(filePath: string, res: http.ServerResponse) {
		fs.readFile(filePath, "utf8", (err, data) => {
			if (err) {
				res.writeHead(500).end("Internal Server Error");
				return;
			}
			const urlMatch = data.match(/URL=(.+)/i);
			if (urlMatch?.[1]) {
				res.writeHead(302, { Location: urlMatch[1] }).end();
			} else {
				res.writeHead(204).end();
			}
		});
	}

	private pipeFile(filePath: string, ext: string, res: http.ServerResponse) {
		const contentType = CONTENT_TYPES[ext];
		if (!contentType) {
			res.writeHead(204).end();
			return;
		}

		const stream = fs.createReadStream(filePath);
		stream.on("error", () => {
			if (!res.headersSent) res.writeHead(404).end("File not found");
		});
		stream.on("open", () => {
			res.writeHead(200, { "Content-Type": contentType });
			stream.pipe(res);
		});
	}

	/**
	 * 处理代理请求
	 * @param pathWithQuery 请求路径及查询参数
	 * @param clientReq 客户端请求对象
	 * @param clientRes 客户端响应对象
	 * @description 将请求转发至 Eagle 本地 API (127.0.0.1:41595)，并处理超时和错误
	 */
	private proxyToEagle(pathWithQuery: string, clientReq: http.IncomingMessage, clientRes: http.ServerResponse) {
		const options: http.RequestOptions = {
			hostname: "127.0.0.1",
			port: 41595,
			path: pathWithQuery,
			method: clientReq.method,
			timeout: 5000,
			headers: {
				"Content-Type": clientReq.headers["content-type"] || "application/json",
			},
		};

		const proxyReq = http.request(options, (proxyRes) => {
			if (proxyRes.headers["content-type"]) {
				clientRes.setHeader("Content-Type", proxyRes.headers["content-type"]);
			}
			clientRes.writeHead(proxyRes.statusCode || 500);
			proxyRes.pipe(clientRes);
		});

		proxyReq.on("error", (err) => {
			print(`Error proxying to Eagle: ${err}`);
			if (!clientRes.headersSent) {
				clientRes.writeHead(500).end("Proxy Error");
			}
		});

		proxyReq.on("timeout", () => {
			proxyReq.destroy();
			if (!clientRes.headersSent) {
				clientRes.writeHead(504).end("Gateway Timeout");
			}
		});

		if (clientReq.method === "GET" || clientReq.method === "HEAD") {
			proxyReq.end();
		} else {
			clientReq.pipe(proxyReq);
		}
	}
}
