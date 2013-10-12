require 'sinatra'
require 'slim'

set :slim, :pretty => true

get '/' do
  slim :index
end
