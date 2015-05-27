package util

import play.api.libs.ws.WS
import scala.concurrent.Future
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global

object ScFetcher {
	def fetchNevergreens(): Future[String] = {
	  WS.url("http://lnz-sc/servicesExchange?hid=reportData&reportFilterID=28586&type=xml&includeHeaders=false&userName=dashboard&passWord=Borl1234&projectID=34").get.map(_.body)
	}
}