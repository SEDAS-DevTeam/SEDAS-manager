{
  'targets': [
    {
      'target_name': 'plane_calculations',
      'sources': [ './addons/plane_calculations.cpp' ],
      "cflags": [ "-fexceptions", "-frtti" ],
      "cflags_cc": [ "-fexceptions", "-frtti" ]
    },
    {
      'target_name': 'enviro_calculations',
      'sources': [ './addons/enviro_calculations.cpp' ],
      "cflags": [ "-fexceptions", "-frtti" ],
      "cflags_cc": [ "-fexceptions", "-frtti" ]
    },
    {
      'target_name': 'main',
      'sources': [ './addons/main.cpp' ],
      "cflags": [ "-fexceptions", "-frtti" ],
      "cflags_cc": [ "-fexceptions", "-frtti" ]
    },
  ]
}