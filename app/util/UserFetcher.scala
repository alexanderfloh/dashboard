package util

import scala.collection.mutable.ListBuffer
import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.libs.ws.WSRequestHolder
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.concurrent.Await
import play.api.libs.json._

object UserFetcher {
  def getUsers(url: String): Future[String] = {
    WS.url(url).get() map { req =>
      Json.prettyPrint(Json.obj(
        "employeesAustria" -> req.body))
    }
  }
}