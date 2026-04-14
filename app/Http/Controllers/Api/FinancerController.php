<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class FinancerController extends Controller
{
    public function index()
    {
        return response()->json(
            User::where('role', 'financer')
                ->orderByRaw('COALESCE(finance_name, name) ASC')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'owner_name'   => 'nullable|string|max:255',
            'finance_name' => 'nullable|string|max:255',
            'mobile'       => 'nullable|string|max:20',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
            'address'      => 'nullable|string',
        ]);

        $data['role']     = 'financer';
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function show(User $financer)
    {
        return response()->json($financer);
    }

    public function update(Request $request, User $financer)
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'owner_name'   => 'nullable|string|max:255',
            'finance_name' => 'nullable|string|max:255',
            'mobile'       => 'nullable|string|max:20',
            'email'        => 'sometimes|email|unique:users,email,' . $financer->id,
            'password'     => 'nullable|string|min:6',
            'address'      => 'nullable|string',
            'is_active'    => 'sometimes|boolean',
        ]);

        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $financer->update($data);

        return response()->json($financer->fresh());
    }

    public function destroy(User $financer)
    {
        $financer->delete();
        return response()->json(['message' => 'Financer deleted.']);
    }
}
