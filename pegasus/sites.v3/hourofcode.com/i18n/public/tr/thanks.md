<% facebook = {:u=>"http://#{request.host}/us"}
                      twitter = {:url=>"http://hourofcode.com", :related=>"codeorg", :hashtags=>"", :text=>hoc_s(:twitter_default_text)}
                      twitter[:hashtags] = "HourOfCode" unless hoc_s(:twitter_default_text).include? "#HourOfCode" %>



# Bir Kodlama Saatine ev sahipliği yapmak için kaydolduğunuz için teşekkürler!

**EVERY** Hour of Code organizer will receive 10 GB of Dropbox space or $10 of Skype credit as a thank you. [Details](<%= hoc_uri('/prizes') %>)

## 1. Organizasyonu yayın

Arkadaşlarınıza #KodlamaSaati 'ni anlatın.

<%= view :share_buttons, facebook:facebook, twitter:twitter %>

<% if @country == 'us' %>

## 2. Tüm okulun bir Kodlama Saati talep etmesini sağlayın

[Send this email](<%= hoc_uri('/resources#email') %>) or [this handout](/files/hoc-one-pager.pdf) to your principal.

<% else %>

## 2. Tüm okulun bir Kodlama Saati talep etmesini sağlayın

[Send this email](<%= hoc_uri('/resources#email') %>) or give [this handout](/files/hoc-one-pager.pdf) this handout</a> to your principal.

<% end %>

## 3. Cömert bir bağış yapın

[Donate to our crowdfunding campaign.](http://<%= codeorg_url() %>/donate) To teach 100 million children, we need your support. We just launched the [largest education crowdfunding campaign](http://<%= codeorg_url() %>/donate) in history. *Every* dollar will be matched [donors](http://<%= codeorg_url() %>/about/donors), doubling your impact.

## İş vereninizden de etkinliğe dahil olmasını rica edin

[Send this email](<%= hoc_uri('/resources#email') %>) to your manager, or the CEO. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf).

## 5. Kodlama Saatini çevrenizde destekleyin

Recruit a local group — boy/girl scouts club, church, university, veterans group or labor union. Or host an Hour of Code "block party" for your neighborhood.

## 5. Yerel yönetim idarelerinden Kodlama Saatini desteklemelerini isteyin

[Send this email](<%= hoc_uri('/resources#politicians') %>) to your mayor, city council, or school board. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf) and invite them to visit your school.

<%= view 'popup_window.js' %>