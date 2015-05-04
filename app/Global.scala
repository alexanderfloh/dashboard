import scala.concurrent.duration._
import scala.io.Source
import actors.PollActor
import actors.PollCi
import akka.actor.Props
import play.Logger
import play.Play
import play.api.GlobalSettings
import play.libs.Akka
import play.api.libs.concurrent.Execution.Implicits._
import actors.PollNightly
import actors.CachedResponseActor
import akka.routing.RoundRobinPool
import Akka.system

object Global extends GlobalSettings {
  override def onStart(app: play.api.Application) = {
    val actor = system.actorOf(Props[PollActor], name = "pollActor")
    
    system.scheduler.schedule(0.seconds, 30.seconds, actor, PollCi)
    system.scheduler.schedule(0.seconds, 5.minutes, actor, PollNightly)
    val router = system.actorOf(Props[CachedResponseActor].withRouter(RoundRobinPool(3)), "router")
  }
}