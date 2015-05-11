import scala.concurrent.duration._
import scala.io.Source
import akka.actor.Props
import play.Logger
import play.Play
import play.api.GlobalSettings
import play.libs.Akka
import play.api.libs.concurrent.Execution.Implicits._
import akka.routing.RoundRobinPool
import Akka.system

object Global extends GlobalSettings {
  override def onStart(app: play.api.Application) = {
  }
}