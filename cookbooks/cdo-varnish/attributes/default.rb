default['cdo-varnish'] = {
  'backends' => {
    'localhost' => '127.0.0.1',
  },
  'secret' => '00000000-0000-0000-0000-000000000000',
  'storage' => 'malloc,0.5G',
}

default['cdo-apps'] = {
  'dashboard' => {
    'port' => 8080,
  },

  'pegasus' => {
    'port' => 8081,
  },

  'i18n' => {
    'languages' => {
      'en' => 'English',
      'fr' => 'French',
    },
  },

} if default['cdo-apps'].empty?
