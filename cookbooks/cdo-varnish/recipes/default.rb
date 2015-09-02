#
# Cookbook Name:: cdo-varnish
# Recipe:: default
#

# From https://www.varnish-cache.org/installation/ubuntu
apt_package 'apt-transport-https'
apt_repository 'varnish' do
  repo_name 'varnish-4.0'
  uri 'https://repo.varnish-cache.org/ubuntu/'
  distribution 'trusty'
  components ['varnish-4.0']
  key 'https://repo.varnish-cache.org/GPG-key.txt'
end
apt_package 'varnish' do
  version '4.0.3-1~trusty'
  options '--force-yes'
  # Keep overwritten package-maintained config files on upgrade
  options '-o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"'
end

# Old Varnish 3.0 vmods from PPA.
# TODO: remove these entries after all servers are updated.
apt_repository 'varnish-3.0-vmods' do
  uri          'ppa:cmcdermottroe/varnish-3.0-vmods'
  distribution 'trusty'
  action :remove
end
apt_package 'libvmod-cookie' do
  action :remove
end
apt_package 'libvmod-header' do
  action :remove
end

service "varnish" do
  action :nothing
end

template '/etc/default/varnish' do
  source 'config.erb'
  user 'root'
  group 'root'
  mode '0644'
  notifies :restart, "service[varnish]"
end

template '/etc/varnish/accept-language.vcl' do
  source 'accept-language.vcl.erb'
  user 'root'
  group 'root'
  mode '0644'
  notifies :restart, "service[varnish]"
end

template '/etc/varnish/default.vcl' do
  source 'default.vcl.erb'
  user 'root'
  group 'root'
  mode '0644'
  notifies :restart, "service[varnish]"
end

template '/etc/varnish/secret' do
  source 'secret.erb'
  user 'root'
  group 'root'
  mode '0600'
  notifies :restart, "service[varnish]"
end

service "varnish" do
  action [:enable, :start]
end
