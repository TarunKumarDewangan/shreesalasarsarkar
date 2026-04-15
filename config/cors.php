<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | This config controls the CORS headers returned by the HandleCors middleware.
    | In production the frontend lives on shreesalasarsarkarfin.com and the API
    | lives on api.shreesalasarsarkarfin.com — both domains are whitelisted here.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Dev
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        // Production
        'https://shreesalasarsarkarfin.com',
        'https://www.shreesalasarsarkarfin.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     | When true, CORS cookies/credentials are allowed.
     | Set to true if you ever switch to cookie-based (Sanctum SPA) auth.
     | For token-based auth (current setup), false is fine.
     */
    'supports_credentials' => false,

];
