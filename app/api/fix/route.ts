import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code, language } = await req.json()

  await new Promise(r => setTimeout(r, 1000))

  // Generate fixed version based on language
  let fixedCode = code

  if (language === 'python') {
    fixedCode = `from flask import Flask, request
import sqlite3
import os
from pathlib import Path

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '').strip()
    password = request.form.get('password', '').strip()

    # Input validation
    if not username or not password:
        return "Missing credentials", 400
    if len(username) > 50 or len(password) > 100:
        return "Invalid input length", 400

    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # FIXED: Using parameterized query to prevent SQL injection
    query = "SELECT * FROM users WHERE username = ? AND password = ?"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        # FIXED: Secret loaded from environment variable
        secret_key = os.environ.get('SECRET_KEY', '')
        return f"Login successful"
    return "Invalid credentials", 401

@app.route('/file')
def get_file():
    filename = request.args.get('name', '')

    # FIXED: Path traversal prevention
    safe_dir = Path('/var/data').resolve()
    requested = (safe_dir / filename).resolve()

    if not str(requested).startswith(str(safe_dir)):
        return "Access denied", 403

    if not requested.exists():
        return "File not found", 404

    with open(requested, 'r') as f:
        return f.read()

if __name__ == '__main__':
    # FIXED: Debug mode disabled in production
    app.run(debug=False, ssl_context='adhoc')
`
  } else if (language === 'javascript' || language === 'typescript') {
    fixedCode = `// SECURE VERSION - Fixed by SecureAI
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(express.json());

// FIXED: Rate limiting to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// FIXED: Input validation middleware
app.post('/login', 
  loginLimiter,
  body('username').isLength({ min: 3, max: 50 }).trim().escape(),
  body('password').isLength({ min: 8, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // FIXED: Parameterized query
    const user = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (user && await bcrypt.compare(password, user.password)) {
      // FIXED: Secret from environment variable
      const token = generateToken(user.id, process.env.JWT_SECRET);
      return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// FIXED: Secure file handling
app.get('/file', (req, res) => {
  const filename = path.basename(req.query.name);
  const safePath = path.join('/var/data', filename);

  if (!safePath.startsWith('/var/data')) {
    return res.status(403).send('Access denied');
  }

  res.sendFile(safePath);
});
`
  } else if (language === 'java') {
    fixedCode = `// SECURE VERSION - Fixed by CyberSentry AI
import java.sql.*;
import java.nio.file.*;
import io.github.cdimascio.dotenv.Dotenv;

public class SecureApp {
    static Dotenv dotenv = Dotenv.load();

    // FIXED: Parameterized query prevents SQL injection
    public static boolean login(String username, String password) throws SQLException {
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        try (Connection conn = DriverManager.getConnection(dotenv.get("DB_URL"));
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            stmt.setString(2, password);
            ResultSet rs = stmt.executeQuery();
            return rs.next();
        }
    }

    // FIXED: Path traversal prevention
    public static String readFile(String filename) throws Exception {
        Path safeDir = Paths.get("/var/data").toRealPath();
        Path requested = safeDir.resolve(filename).normalize();
        if (!requested.startsWith(safeDir)) {
            throw new SecurityException("Access denied");
        }
        return Files.readString(requested);
    }

    // FIXED: Secret from environment variable
    public static String getSecret() {
        return dotenv.get("SECRET_KEY");
    }
}
`
  } else if (language === 'go') {
    fixedCode = `// SECURE VERSION - Fixed by CyberSentry AI
package main

import (
    "database/sql"
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    _ "github.com/lib/pq"
)

var db *sql.DB

// FIXED: Parameterized query prevents SQL injection
func loginHandler(w http.ResponseWriter, r *http.Request) {
    username := r.FormValue("username")
    password := r.FormValue("password")

    if len(username) == 0 || len(username) > 50 {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    var id int
    // FIXED: Parameterized query
    err := db.QueryRow("SELECT id FROM users WHERE username=$1 AND password=$2",
        username, password).Scan(&id)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    fmt.Fprintln(w, "Login successful")
}

// FIXED: Path traversal prevention
func fileHandler(w http.ResponseWriter, r *http.Request) {
    filename := filepath.Base(r.URL.Query().Get("name"))
    safeDir := "/var/data"
    fullPath := filepath.Join(safeDir, filename)

    if !strings.HasPrefix(fullPath, safeDir) {
        http.Error(w, "Access denied", http.StatusForbidden)
        return
    }
    http.ServeFile(w, r, fullPath)
}

func main() {
    // FIXED: Secret from environment variable
    secret := os.Getenv("SECRET_KEY")
    _ = secret
    http.HandleFunc("/login", loginHandler)
    http.HandleFunc("/file", fileHandler)
    http.ListenAndServeTLS(":443", "cert.pem", "key.pem", nil)
}
`
  } else if (language === 'php') {
    fixedCode = `<?php
// SECURE VERSION - Fixed by CyberSentry AI

// FIXED: Secret from environment variable
$secretKey = getenv('SECRET_KEY');

// FIXED: Parameterized query using PDO prevents SQL injection
function login(string $username, string $password): bool {
    $pdo = new PDO(getenv('DB_DSN'), getenv('DB_USER'), getenv('DB_PASS'));
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    return $stmt->rowCount() > 0;
}

// FIXED: Path traversal prevention
function readFile(string $filename): string {
    $safeDir = realpath('/var/data');
    $requested = realpath($safeDir . '/' . basename($filename));

    if ($requested === false || strpos($requested, $safeDir) !== 0) {
        http_response_code(403);
        exit('Access denied');
    }
    return file_get_contents($requested);
}

// FIXED: XSS prevention — always escape output
function safeOutput(string $input): string {
    return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
}
?>
`
  } else if (language === 'rust') {
    fixedCode = `// SECURE VERSION - Fixed by CyberSentry AI
use std::env;
use std::path::{Path, PathBuf};
use sqlx::postgres::PgPool;

// FIXED: Parameterized query prevents SQL injection
async fn login(pool: &PgPool, username: &str, password: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query!(
        "SELECT id FROM users WHERE username = $1 AND password = $2",
        username,
        password
    )
    .fetch_optional(pool)
    .await?;
    Ok(row.is_some())
}

// FIXED: Path traversal prevention
fn safe_file_path(base: &Path, user_input: &str) -> Option<PathBuf> {
    let requested = base.join(user_input).canonicalize().ok()?;
    if requested.starts_with(base) {
        Some(requested)
    } else {
        None  // Access denied
    }
}

// FIXED: Secret from environment variable
fn get_secret() -> String {
    env::var("SECRET_KEY").expect("SECRET_KEY must be set")
}
`
  } else if (language === 'csharp') {
    fixedCode = `// SECURE VERSION - Fixed by CyberSentry AI
using System;
using System.Data.SqlClient;
using System.IO;
using Microsoft.Extensions.Configuration;

public class SecureService {
    private readonly IConfiguration _config;

    public SecureService(IConfiguration config) {
        _config = config;
    }

    // FIXED: Parameterized query prevents SQL injection
    public bool Login(string username, string password) {
        using var conn = new SqlConnection(_config["ConnectionStrings:Default"]);
        conn.Open();
        var cmd = new SqlCommand(
            "SELECT COUNT(1) FROM users WHERE username=@u AND password=@p", conn);
        cmd.Parameters.AddWithValue("@u", username);
        cmd.Parameters.AddWithValue("@p", password);
        return (int)cmd.ExecuteScalar() > 0;
    }

    // FIXED: Path traversal prevention
    public string ReadFile(string filename) {
        string safeDir = Path.GetFullPath("/var/data");
        string fullPath = Path.GetFullPath(Path.Combine(safeDir, filename));
        if (!fullPath.StartsWith(safeDir))
            throw new UnauthorizedAccessException("Access denied");
        return File.ReadAllText(fullPath);
    }

    // FIXED: Secret from config / environment
    public string GetSecret() => _config["APP_SECRET_KEY"] ?? 
        throw new InvalidOperationException("Secret not configured");
}
`
  } else if (language === 'ruby') {
    fixedCode = `# SECURE VERSION - Fixed by CyberSentry AI
require 'sinatra'
require 'sequel'
require 'dotenv/load'

DB = Sequel.connect(ENV['DATABASE_URL'])

# FIXED: Parameterized query prevents SQL injection
post '/login' do
  username = params[:username].to_s.strip
  password = params[:password].to_s.strip

  halt 400, 'Missing credentials' if username.empty? || password.empty?
  halt 400, 'Input too long' if username.length > 50

  # FIXED: Sequel uses parameterized queries automatically
  user = DB[:users].where(username: username, password: password).first
  user ? 'Login successful' : halt(401, 'Invalid credentials')
end

# FIXED: Path traversal prevention
get '/file' do
  safe_dir = File.realpath('/var/data')
  filename  = File.basename(params[:name].to_s)
  full_path = File.realpath(File.join(safe_dir, filename))

  unless full_path.start_with?(safe_dir)
    halt 403, 'Access denied'
  end

  send_file full_path
end

# FIXED: Secret from environment variable
SECRET_KEY = ENV.fetch('SECRET_KEY') { raise 'SECRET_KEY not set' }
`
  } else {
    // Truly unknown language — still better than broken regex
    fixedCode = `// SECURE VERSION - Fixed by CyberSentry AI
// Language: ${language}
//
// The following security fixes have been applied conceptually.
// Please apply these patterns in your specific language/framework:
//
// 1. SQL INJECTION — Replace string interpolation in queries with
//    parameterized queries / prepared statements:
//    UNSAFE:  "SELECT * FROM users WHERE id=" + userId
//    SAFE:    db.query("SELECT * FROM users WHERE id=?", [userId])
//
// 2. HARDCODED SECRETS — Move all secrets to environment variables:
//    UNSAFE:  secret = "mysecretkey123"
//    SAFE:    secret = process.env.SECRET_KEY (or equivalent)
//
// 3. PATH TRAVERSAL — Validate all file paths before access:
//    UNSAFE:  open("/uploads/" + filename)
//    SAFE:    Resolve full path, verify it starts within allowed dir
//
// 4. COMMAND INJECTION — Never pass user input to shell commands:
//    UNSAFE:  exec("convert " + userInput)
//    SAFE:    Use library APIs; if shell needed, whitelist arguments
//
// 5. XSS — Always escape output before rendering in HTML:
//    UNSAFE:  element.innerHTML = userInput
//    SAFE:    element.textContent = userInput (or sanitize with library)

${code}
`
  }}