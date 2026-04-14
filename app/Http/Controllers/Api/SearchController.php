<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Loan;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function global(Request $request)
    {
        $q = $request->query('q');
        $user = $request->user();

        // Search Borrowers (including Vehicle and Loan info)
        $query = Borrower::with(['vehicle', 'loans']);

        if ($q && strlen($q) >= 2) {
            $query->where(function($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                      ->orWhere('mobile', 'like', "%{$q}%")
                      ->orWhere('folio_no', 'like', "%{$q}%")
                      ->orWhereHas('vehicle', function($v) use ($q) {
                          $v->where('vehicle_no', 'like', "%{$q}%")
                            ->orWhere('chassis_no', 'like', "%{$q}%");
                      });
            });
        }

        if (!$user->isAdmin()) {
            $query->where('financer_id', $user->id);
        }

        $results = $query->take(10)->orderBy('id', 'desc')->get()->map(function($b) {
            $loan = $b->loans->first();
            return [
                'id'         => $b->id,
                'loan_id'    => $loan ? $loan->id : null,
                'name'       => $b->name,
                'mobile'     => $b->mobile,
                'vehicle_no' => $b->vehicle ? $b->vehicle->vehicle_no : 'Pending',
                'folio'      => $b->folio_prefix . '-' . $b->folio_no,
                'address'    => $b->address,
                'type'       => $loan ? 'LOAN' : 'BORROWER'
            ];
        });

        return response()->json($results);
    }
}
