<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id', 'user_type', 'action', 'model_type', 'model_id', 'payload', 'ip_address'
    ];

    protected $casts = [
        'payload' => 'array'
    ];

    public static function log(Request $request, string $action, Model $model = null, array $payload = []): void
    {
        $user = $request->user();
        
        self::create([
            'user_id'    => $user?->id,
            'user_type'  => $user ? get_class($user) : null,
            'action'     => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id'   => $model?->id,
            'payload'    => $payload,
            'ip_address' => $request->ip(),
        ]);
    }
}
