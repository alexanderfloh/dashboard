package util

import play.api.libs.ws.WS
import scala.concurrent.Future
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play

object ScFetcher {
	def fetchNevergreens(): Future[String] = {
    val url = Play.current.configuration.getString("sc.nevergreens").getOrElse(throw new RuntimeException("sc.nevergreens not configured"))
	  WS.url(url).get.map(_.body)
	}
  
  def fetchWin10BVTs(): Future[String] = {
    val url = Play.current.configuration.getString("sc.win10bvts").getOrElse(throw new RuntimeException("sc.win10bvts not configured"))
    WS.url(url).get.map(_.body)
  }
}