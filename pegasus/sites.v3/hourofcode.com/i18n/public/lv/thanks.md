<% facebook = {:u=>"http://#{request.host}/us"}
                      twitter = {:url=>"http://hourofcode.com", :related=>"codeorg", :hashtags=>"", :text=>hoc_s(:twitter_default_text)}
                      twitter[:hashtags] = "HourOfCode" unless hoc_s(:twitter_default_text).include? "#HourOfCode" %>



# Paldies par to ka uzņēmies vadīt programmēšanas stundu!

**Katrs** Programmēšanas stundas organizators saņems pateicībā 10 GB vietas Dropbox vai arī $10 Skype kredītu. [ Sīkāk](<%= hoc_uri('/prizes') %>)

## 1. Dalies ar informāciju

Pastāsti saviem draugiem par #HourOfCode.

<%= view :share_buttons, facebook:facebook, twitter:twitter %>

<% if @country == 'us' %>

## 2. Lūdz visai skolai piedalīties Programmēšanas stundā

[Send this email](<%= hoc_uri('/resources#email') %>) or [this handout](/files/hoc-one-pager.pdf) to your principal.

<% else %>

## 2. Lūdz visai skolai piedalīties Programmēšanas stundā

[Send this email](<%= hoc_uri('/resources#email') %>) or give [this handout](/files/hoc-one-pager.pdf) this handout</a> to your principal.

<% end %>

## 3. Veic dāsnu ziedojumu

[Donate to our crowdfunding campaign.](http://<%= codeorg_url() %>/donate) To teach 100 million children, we need your support. We just launched the [largest education crowdfunding campaign](http://<%= codeorg_url() %>/donate) in history. *Every* dollar will be matched [donors](http://<%= codeorg_url() %>/about/donors), doubling your impact.

## 4. Aiciniet savu darba devēju iesaistīties

[Send this email](<%= hoc_uri('/resources#email') %>) to your manager, or the CEO. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf).

## 5. Uzslavē "Programmēšanas stundu" savā kopienā

Recruit a local group — boy/girl scouts club, church, university, veterans group or labor union. Or host an Hour of Code "block party" for your neighborhood.

## 6. Jautājiet ievēlētajai amatpersonai, lai atbalsta "Programmēšanas stundu"

[Send this email](<%= hoc_uri('/resources#politicians') %>) to your mayor, city council, or school board. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf) and invite them to visit your school.

<%= view 'popup_window.js' %>