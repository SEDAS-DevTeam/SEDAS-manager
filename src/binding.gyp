{
  'targets': [
    {
      'target_name': 'plane_calculations',
      'sources': [ './addons/plane_calculations.cpp' ],
      "cflags": [ "-fexceptions" ],
      "cflags_cc": [ "-fexceptions" ]
    },
    {
      'target_name': 'enviro_calculations',
      'sources': [ './addons/enviro_calculations.cpp' ],
      "cflags": [ "-fexceptions" ],
      "cflags_cc": [ "-fexceptions" ]
    },
    {
      'target_name': 'main',
      'sources': [ './addons/main.cpp' ],
      "cflags": [ "-fexceptions" ],
      "cflags_cc": [ "-fexceptions" ]
    }
  ]
}