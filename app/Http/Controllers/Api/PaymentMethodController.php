<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    private function resolveFinancerId(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            return $request->financer_id ?? $user->id;
        }
        if ($user->isStaff()) {
            return $user->financer_id;
        }
        return $user->id;
    }

    public function index(Request $request)
    {
        $financerId = $this->resolveFinancerId($request);
        $methods = PaymentMethod::where('financer_id', $financerId)->get();
        return response()->json($methods);
    }

    public function store(Request $request)
    {
        $financerId = $this->resolveFinancerId($request);
        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:50',
                Rule::unique('payment_methods')->where('financer_id', $financerId)
            ],
            'is_active' => 'boolean'
        ]);

        $method = PaymentMethod::create([
            'financer_id' => $financerId,
            'name' => $data['name'],
            'is_active' => $data['is_active'] ?? true
        ]);

        return response()->json($method, 201);
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        
        if (!$user->isAdmin() && $paymentMethod->financer_id !== $effectiveOwnerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:50',
                Rule::unique('payment_methods')->where('financer_id', $paymentMethod->financer_id)->ignore($paymentMethod->id)
            ],
            'is_active' => 'boolean'
        ]);

        $paymentMethod->update($data);
        return response()->json($paymentMethod);
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        
        if (!$user->isAdmin() && $paymentMethod->financer_id !== $effectiveOwnerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $paymentMethod->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
