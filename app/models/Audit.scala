package models

import scala.concurrent.Future
import play.api.Play
import util.PhabricatorFetcher
import play.api.libs.json._
import play.api.libs.functional.syntax._
//import play.libs.Json._
import play.api.libs.ws.WS

//implicits
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current

object Phabricator {
  type PHID = String
}

case class Audit(
    id: String,
    commit: Phabricator.PHID,
    auditor: Phabricator.PHID,
    reasons: List[String],
    status: String) {

}

object Audit {

  private def config = Play.current.configuration

  def fetchOpenAudits: Future[List[Audit]] = fetchOpenAuditsJson.map { js =>
    (js \ "result").asOpt[List[Audit]].getOrElse(List())
  }

  def fetchOpenAuditsJson: Future[JsValue] = {
    val baseUrl = config.getString("dashboard.urlPhabricator")
      .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

    val conduit = PhabricatorFetcher.conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "status" -> "audit-status-open")

      WS.url(baseUrl + "api/audit.query")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req =>
          Json.parse(req.body)
        }
    }
  }

  implicit val reads: Reads[Audit] = (
    (JsPath \ "id").read[String] and
    (JsPath \ "commitPHID").read[Phabricator.PHID] and
    (JsPath \ "auditorPHID").read[Phabricator.PHID] and
    (JsPath \ "reasons").read[List[String]] and
    (JsPath \ "status").read[String])(Audit.apply _)

}