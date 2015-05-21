package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger
import models.NevergreenResult
import scala.util.parsing.json.JSONArray
import scala.util.Try

object JenkinsFetcherFactory {

  def getFetcher(fetcher:String): JenkinsFetcher = {
    fetcher match {
      case "performer" => JenkinsFetcherPerformer
      case "silktest"  => JenkinsFetcherSilkTest
    }
  }
}