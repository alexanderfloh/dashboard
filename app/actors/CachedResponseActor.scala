package actors

import akka.actor.Actor

case class UpdateResponseCi(response: String)
case class UpdateResponseNightly(response: String)
case object GetResponseCi
case object GetResponseNightly

class CachedResponseActor extends Actor {
  var cachedResponseCi = ""
  var cachedResponseNightly = ""

  def receive = {
    case UpdateResponseCi(response) => cachedResponseCi = response
    case UpdateResponseNightly(response) => cachedResponseNightly = response
    case GetResponseCi => sender ! cachedResponseCi
    case GetResponseNightly => sender ! cachedResponseNightly
  }
}