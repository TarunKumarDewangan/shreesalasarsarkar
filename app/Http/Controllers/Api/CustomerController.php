<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Borrower;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    private function financer_id(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) return $request->financer_id ?? $user->id;
        if ($user->isStaff()) return $user->financer_id;
        return $user->id;
    }

    public function index(Request $request)
    {
        $query = Customer::withCount('borrowers')
            ->where('financer_id', $this->financer_id($request));

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('mobile', 'like', "%$search%")
                  ->orWhere('aadhar', 'like', "%$search%");
            });
        }

        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function show(Request $request, Customer $customer)
    {
        $this->authorizeAccess($request, $customer);
        return response()->json($customer->load(['borrowers.loans', 'borrowers.vehicle']));
    }

    public function syncAll(Request $request)
    {
        $financerId = $this->financer_id($request);
        $borrowers = \App\Models\Borrower::where('financer_id', $financerId)->get();

        foreach ($borrowers as $b) {
            \App\Models\Borrower::syncCustomer($b);
        }

        return response()->json([
            'message' => 'Synchronization complete.',
            'count'   => $borrowers->count()
        ]);
    }

    private function authorizeAccess(Request $request, Customer $customer): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;

        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        
        if ($customer->financer_id !== $effectiveOwnerId) {
            abort(403, 'Access denied.');
        }
    }
}
