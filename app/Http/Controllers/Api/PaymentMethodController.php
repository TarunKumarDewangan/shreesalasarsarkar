<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $methods = PaymentMethod::where('financer_id', $user->id)->get();
        return response()->json($methods);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:50',
                Rule::unique('payment_methods')->where('financer_id', $user->id)
            ],
            'is_active' => 'boolean'
        ]);

        $method = PaymentMethod::create([
            'financer_id' => $user->id,
            'name' => $data['name'],
            'is_active' => $data['is_active'] ?? true
        ]);

        return response()->json($method, 201);
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $user = $request->user();
        if ($paymentMethod->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:50',
                Rule::unique('payment_methods')->where('financer_id', $user->id)->ignore($paymentMethod->id)
            ],
            'is_active' => 'boolean'
        ]);

        $paymentMethod->update($data);
        return response()->json($paymentMethod);
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $user = $request->user();
        if ($paymentMethod->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $paymentMethod->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
