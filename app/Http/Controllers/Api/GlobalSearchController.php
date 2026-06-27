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

        $user = $request->user();
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        $cbcode = $user->isAdmin() ? null : ($user->cbcode ?? $user->finance_name ?? null);

        $results = [];

        // 1. Search New Borrowers (Name, Mobile, Folio, Vehicle Reg)
        $borrowersQuery = Borrower::where(function($q) use ($query) {
            $q->where('name', 'LIKE', "%$query%")
              ->orWhere('mobile', 'LIKE', "%$query%")
              ->orWhere('folio_no', 'LIKE', "%$query%")
              ->orWhereHas('vehicle', function($vq) use ($query) {
                  $vq->where('vehicle_no', 'LIKE', "%$query%")
                    ->orWhere('reg_no', 'LIKE', "%$query%");
              });
        });

        if (!$user->isAdmin()) {
            $borrowersQuery->where('financer_id', $effectiveOwnerId);
        }

        $borrowers = $borrowersQuery->with(['latestLoan', 'vehicle'])
            ->limit(10)
            ->get();

        foreach ($borrowers as $b) {
            $results[] = [
                'type' => 'New Borrower',
                'title' => $b->name,
                'subtitle' => "FNO: {$b->folio_no} • {$b->mobile}",
                'meta' => $b->vehicle->vehicle_no ?? ($b->vehicle->reg_no ?? 'No Vehicle'),
                'url' => "/borrowers/{$b->id}",
                'icon' => 'user'
            ];
        }

        // 2. Search Backlog Accounts
        $backlogQuery = BacklogAccount::where(function($q) use ($query) {
            $q->where('customer_name', 'LIKE', "%$query%")
              ->orWhere('mobile', 'LIKE', "%$query%")
              ->orWhere('fno', 'LIKE', "%$query%")
              ->orWhere('vehicle_no', 'LIKE', "%$query%");
        });

        if (!$user->isAdmin() && $cbcode) {
            $backlogQuery->where('cbcode', $cbcode);
        }

        $backlog = $backlogQuery->limit(10)
            ->get();

        foreach ($backlog as $bl) {
            $results[] = [
                'type' => 'Backlog',
                'title' => $bl->customer_name,
                'subtitle' => "FNO: {$bl->fno} • {$bl->mobile}",
                'meta' => $bl->vehicle_no,
                'url' => "/backlog/{$bl->id}",
                'icon' => 'history'
            ];
        }

        return response()->json(['results' => $results]);
    }
}
