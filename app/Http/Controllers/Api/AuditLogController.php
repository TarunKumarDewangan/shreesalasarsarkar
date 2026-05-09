<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        // Strictly only for admin
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('user')->orderBy('id', 'desc');

        if ($request->action) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        return response()->json($query->paginate(50));
    }
}
