<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Tables exported/imported in dependency order.
     * The order matters: parent tables must come before child tables.
     */
    private const TABLES = [
        'users',
        'customers',
        'payment_methods',
        'whatsapp_settings',
        'borrowers',
        'guarantors',
        'vehicles',
        'loans',
        'installments',
        'recoveries',
        'backlog_accounts',
        'backlog_installments',
        'audit_logs',
    ];

    private const BACKUP_VERSION = '1.0';
    private const APP_IDENTIFIER  = 'ShreeSalasarSarkar';

    // ─────────────────────────────────────────────────────────
    // EXPORT
    // ─────────────────────────────────────────────────────────

    /**
     * Stream a full JSON backup to the client.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $now  = now()->format('Y-m-d_H-i-s');

        $data = [
            'version'     => self::BACKUP_VERSION,
            'app'         => self::APP_IDENTIFIER,
            'exported_at' => now()->toIso8601String(),
            'exported_by' => ['id' => $user->id, 'name' => $user->name],
            'tables'      => [],
        ];

        foreach (self::TABLES as $table) {
            $data['tables'][$table] = DB::table($table)->get()->map(function ($row) {
                return (array) $row;
            })->toArray();
        }

        $json     = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $filename = "sss_backup_{$now}.json";

        return response()->streamDownload(function () use ($json) {
            echo $json;
        }, $filename, [
            'Content-Type'        => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Content-Length'      => strlen($json),
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // PREVIEW IMPORT
    // ─────────────────────────────────────────────────────────

    /**
     * Parse the uploaded backup and return a count summary
     * WITHOUT touching the database.
     */
    public function previewImport(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|max:51200', // 50 MB
        ]);

        $parsed = $this->parseAndValidateFile($request->file('backup_file'));
        if (isset($parsed['error'])) {
            return response()->json(['message' => $parsed['error']], 422);
        }

        $backupData = $parsed['data'];
        $summary    = [];

        foreach (self::TABLES as $table) {
            $backupCount   = count($backupData['tables'][$table] ?? []);
            $currentCount  = DB::table($table)->count();
            $summary[]     = [
                'table'          => $table,
                'backup_records' => $backupCount,
                'current_records'=> $currentCount,
            ];
        }

        return response()->json([
            'exported_at' => $backupData['exported_at'],
            'exported_by' => $backupData['exported_by'],
            'summary'     => $summary,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // IMPORT
    // ─────────────────────────────────────────────────────────

    /**
     * Destructively replace all data with the backup file contents.
     * Wrapped in a transaction — rolls back completely on any error.
     */
    public function import(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|max:51200', // 50 MB
        ]);

        $parsed = $this->parseAndValidateFile($request->file('backup_file'));
        if (isset($parsed['error'])) {
            return response()->json(['message' => $parsed['error']], 422);
        }

        $backupData = $parsed['data'];
        $counts     = [];

        try {
            DB::transaction(function () use ($backupData, &$counts) {

                // 1. Disable FK checks so we can delete and insert in any order
                DB::statement('SET FOREIGN_KEY_CHECKS=0');

                // 2. Delete all records from all tables in reverse dependency order
                foreach (array_reverse(self::TABLES) as $table) {
                    DB::table($table)->delete();
                }

                // 3. Insert data in dependency order
                foreach (self::TABLES as $table) {
                    $rows = $backupData['tables'][$table] ?? [];

                    if (empty($rows)) {
                        $counts[$table] = 0;
                        continue;
                    }

                    // Insert in chunks of 500 rows to avoid packet-size issues
                    $chunks = array_chunk($rows, 500);
                    foreach ($chunks as $chunk) {
                        DB::table($table)->insert($chunk);
                    }

                    $counts[$table] = count($rows);
                }

                // 4. Re-enable FK checks
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            });
        } catch (\Throwable $e) {
            // Make sure FK checks are re-enabled even if transaction rolled back
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            return response()->json([
                'message' => 'Import failed and was rolled back: ' . $e->getMessage(),
            ], 500);
        }

        // Log the restore action
        \App\Models\AuditLog::create([
            'user_id'    => $request->user()->id,
            'user_type'  => get_class($request->user()),
            'action'     => 'SYSTEM_RESTORE',
            'model_type' => null,
            'model_id'   => null,
            'payload'    => ['counts' => $counts, 'source_exported_at' => $backupData['exported_at']],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Restore completed successfully.',
            'counts'  => $counts,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────

    private function parseAndValidateFile($file): array
    {
        $content = file_get_contents($file->getRealPath());
        $data    = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['error' => 'Invalid JSON file: ' . json_last_error_msg()];
        }

        if (($data['app'] ?? '') !== self::APP_IDENTIFIER) {
            return ['error' => 'This backup file is not from the Shree Salasar Sarkar system.'];
        }

        if (($data['version'] ?? '') !== self::BACKUP_VERSION) {
            return ['error' => 'Unsupported backup version: ' . ($data['version'] ?? 'unknown')];
        }

        if (!isset($data['tables']) || !is_array($data['tables'])) {
            return ['error' => 'Backup file is missing the tables section.'];
        }

        return ['data' => $data];
    }
}
