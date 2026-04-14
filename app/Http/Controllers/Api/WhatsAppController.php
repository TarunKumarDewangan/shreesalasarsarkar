<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WhatsAppController extends Controller
{
    protected $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    public function getSettings(Request $request)
    {
        $user = Auth::user();
        $financerId = $request->query('financer_id');

        // Admin can view any financer's settings
        if ($user->role === 'admin' && $financerId) {
            $settings = WhatsAppSetting::where('user_id', $financerId)->first();
        } else {
            // Financer or Staff view their owner financer's settings
            $targetId = $user->role === 'financer' ? $user->id : $user->financer_id;
            $settings = WhatsAppSetting::where('user_id', $targetId)->first();
        }

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'financer_id' => 'sometimes|integer|exists:users,id',
            'instance_id' => 'required|string',
            'access_token' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $financerId = $request->input('financer_id');

        // Determine which financer to update
        if ($user->role === 'admin' && $financerId) {
            $targetId = $financerId;
        } else {
            $targetId = $user->role === 'financer' ? $user->id : $user->financer_id;
        }

        if (!$targetId) {
            return response()->json(['success' => false, 'message' => 'Financer ID required'], 400);
        }

        $settings = WhatsAppSetting::updateOrCreate(
            ['user_id' => $targetId],
            [
                'instance_id' => $request->instance_id,
                'access_token' => $request->access_token,
                'is_active' => $request->input('is_active', true),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp settings updated successfully',
            'settings' => $settings
        ]);
    }

    public function testConnection(Request $request)
    {
        $request->validate([
            'instance_id' => 'required|string',
            'access_token' => 'required|string',
            'mobile' => 'required|string',
        ]);

        $result = $this->whatsAppService->testConnection(
            $request->instance_id,
            $request->access_token,
            $request->mobile
        );

        return response()->json($result);
    }
}
