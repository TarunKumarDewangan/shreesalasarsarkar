<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isFinancer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff = User::where('financer_id', $user->id)
            ->where('role', 'staff')
            ->get();

        return response()->json($staff);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isFinancer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'mobile'   => 'nullable|string|max:20',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'address'  => 'nullable|string',
            'is_active'=> 'boolean'
        ]);

        $staff = User::create([
            'name'        => $data['name'],
            'mobile'      => $data['mobile'],
            'email'       => $data['email'],
            'password'    => $data['password'],
            'address'     => $data['address'] ?? null,
            'is_active'   => $data['is_active'] ?? true,
            'role'        => 'staff',
            'financer_id' => $user->id,
        ]);

        return response()->json($staff, 201);
    }

    public function update(Request $request, User $staff)
    {
        $user = $request->user();
        if (!$user->isFinancer() || $staff->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'mobile'   => 'nullable|string|max:20',
            'email'    => ['required', 'email', Rule::unique('users')->ignore($staff->id)],
            'password' => 'nullable|string|min:6',
            'address'  => 'nullable|string',
            'is_active'=> 'boolean'
        ]);

        $updateData = [
            'name'      => $data['name'],
            'mobile'    => $data['mobile'],
            'email'     => $data['email'],
            'address'   => $data['address'] ?? $staff->address,
            'is_active' => $data['is_active'] ?? $staff->is_active,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $staff->update($updateData);

        return response()->json($staff);
    }

    public function destroy(Request $request, User $staff)
    {
        $user = $request->user();
        if (!$user->isFinancer() || $staff->financer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function recoveryMen(Request $request)
    {
        $user = $request->user();
        $staff = User::where('financer_id', $user->id)
            ->where('role', 'staff')
            ->where('is_active', true)
            ->get(['id', 'name']);

        return response()->json($staff);
    }
}
