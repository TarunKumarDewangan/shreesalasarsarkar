<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\BacklogAccount;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('q');
        if (!$query || strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        // 1. Search New Borrowers (Name, Mobile, Folio, Vehicle Reg)
        $borrowers = Borrower::where(function($q) use ($query) {
            $q->where('name', 'LIKE', "%$query%")
              ->orWhere('mobile', 'LIKE', "%$query%")
              ->orWhere('folio_no', 'LIKE', "%$query%")
              ->orWhereHas('vehicle', function($vq) use ($query) {
                  $vq->where('reg_no', 'LIKE', "%$query%");
              });
        })
        ->with(['latestLoan', 'vehicle'])
        ->limit(10)
        ->get();

        foreach ($borrowers as $b) {
            $results[] = [
                'type' => 'New Borrower',
                'title' => $b->name,
                'subtitle' => "FNO: {$b->folio_no} • {$b->mobile}",
                'meta' => $b->vehicle->reg_no ?? 'No Vehicle',
                'url' => "/borrowers/{$b->id}",
                'icon' => 'user'
            ];
        }

        // 2. Search Backlog Accounts
        $backlog = BacklogAccount::where(function($q) use ($query) {
            $q->where('customer_name', 'LIKE', "%$query%")
              ->orWhere('mobile', 'LIKE', "%$query%")
              ->orWhere('folio_no', 'LIKE', "%$query%")
              ->orWhere('vehicle_no', 'LIKE', "%$query%");
        })
        ->limit(10)
        ->get();

        foreach ($backlog as $bl) {
            $results[] = [
                'type' => 'Backlog',
                'title' => $bl->customer_name,
                'subtitle' => "FNO: {$bl->folio_no} • {$bl->mobile}",
                'meta' => $bl->vehicle_no,
                'url' => "/backlog/{$bl->id}",
                'icon' => 'history'
            ];
        }

        return response()->json(['results' => $results]);
    }
}
