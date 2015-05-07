package controllers

import java.net.URI
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.Logger
import play.api.Play
import play.api.data.Form
import play.api.data.Forms.text
import play.api.data.Forms.tuple
import play.api.libs.json.Json
import play.api.libs.ws.WS
import play.api.mvc.Action
import play.api.mvc.Controller
import util.MockResponseGenerator
import play.api.libs.json.JsArray
import play.api.libs.json.JsValue
import play.api.libs.json.JsObject
import play.api.libs.concurrent.Akka
import play.api.Play.current
import akka.pattern.ask
import actors.GetResponseCi
import akka.util.Timeout
import scala.concurrent.duration._
import actors.GetResponseNightly
import util.CI
import util.Nightly
import util.JenkinsFetcher
import util.PhabricatorFetcher
import scala.concurrent.Await
object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def buildCI = Action.async {
    if (Play.current.configuration.getBoolean("dashboard.mockResponse").getOrElse(false)) {
      Future(Ok(MockResponseGenerator(CI)).as("text; charset=utf-8"))
    } else {
      val urlCi = Play.current.configuration.getString("dashboard.urlCi")
        .getOrElse(throw new RuntimeException("dashboard.urlCi not configured"))
      JenkinsFetcher.fetchCI(urlCi, "buildCI", 4).map(Ok(_))
    }
  }
  
  def buildNightly = Action.async {
    if (Play.current.configuration.getBoolean("dashboard.mockResponse").getOrElse(false)) {
      Future(Ok(MockResponseGenerator(Nightly)).as("text; charset=utf-8"))
    } else {
      
      val urlNightly = Play.current.configuration.getString("dashboard.urlNightly")
        .getOrElse(throw new RuntimeException("dashboard.urlNightly not configured"))
      JenkinsFetcher.fetchNightly(urlNightly, "buildNightly", 1).map(Ok(_))
      
    }
  }
  
  def getPhabUser = Action.async {
    val response = PhabricatorFetcher.fetchPhabricatorUser("http://lnz-phabricator.microfocus.com/", "AlexanderFl", "wxuhvuaaow2wzf76juqwskpfstz6pfpn2ez3yx5wdpagtaqtnsobr3hjx3d23wpvcnscec7zh3i4g5myyvxy4efkwxcfmwzozfj2kbemx5lqyuqhoxsawxdtmgtvet57c25qrgbwlvvv77dccjzep6oiskct3tmmaimlnnqm2hmb7sxhz6bulln2l6lak5siw2gyhyonx6opjwb7wi74vpowttb3cbsce54emwrabur6dqea2uzv26ajytu4xvo");
    val f: Future[String] = Future(response)
    f.map { Ok(_) }
  }
  
  def getPhabAudits = Action.async {
    val response = PhabricatorFetcher.fetchOpenAudits("http://lnz-phabricator.microfocus.com/", "AlexanderFl", "wxuhvuaaow2wzf76juqwskpfstz6pfpn2ez3yx5wdpagtaqtnsobr3hjx3d23wpvcnscec7zh3i4g5myyvxy4efkwxcfmwzozfj2kbemx5lqyuqhoxsawxdtmgtvet57c25qrgbwlvvv77dccjzep6oiskct3tmmaimlnnqm2hmb7sxhz6bulln2l6lak5siw2gyhyonx6opjwb7wi74vpowttb3cbsce54emwrabur6dqea2uzv26ajytu4xvo");
    val f: Future[String] = Future(response)
    f.map { Ok(_) }
  }
}